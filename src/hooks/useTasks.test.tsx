import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types/task";

const sampleTasks: Task[] = [
  { id: "1", title: "A", description: "", status: "todo", priority: "low", assignee: "Alice", createdAt: "2026-01-01T00:00:00Z" },
];

vi.mock("../api/mockApi", () => ({
  fetchTasks: vi.fn(),
  updateTaskStatus: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

describe("useTasks", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("transitions from loading to success once the fetch resolves", async () => {
    const { fetchTasks } = await import("../api/mockApi");
    vi.mocked(fetchTasks).mockResolvedValue(structuredClone(sampleTasks));
    const { useTasks } = await import("./useTasks");

    const { result } = renderHook(() => useTasks());

    expect(result.current.state.status).toBe("loading");

    await waitFor(() => expect(result.current.state.status).toBe("success"));
    expect(result.current.state.tasks).toEqual(sampleTasks);
  });

  it("applies an optimistic status update and rolls it back when the API call rejects", async () => {
    const { fetchTasks, updateTaskStatus } = await import("../api/mockApi");
    vi.mocked(fetchTasks).mockResolvedValue(structuredClone(sampleTasks));
    vi.mocked(updateTaskStatus).mockRejectedValue(new Error("simulated failure"));
    const { useTasks } = await import("./useTasks");

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.state.status).toBe("success"));

    act(() => {
      result.current.setStatus("1", "done");
    });

    // Optimistic update applies immediately, before the rejected promise settles.
    expect(result.current.state.status).toBe("success");
    if (result.current.state.status === "success") {
      expect(result.current.state.tasks[0].status).toBe("done");
    }

    await waitFor(() => {
      if (result.current.state.status !== "success") throw new Error("not success");
      expect(result.current.state.tasks[0].status).toBe("todo");
    });
  });

  it("transitions to an error state when the fetch rejects", async () => {
    const { fetchTasks } = await import("../api/mockApi");
    vi.mocked(fetchTasks).mockRejectedValue(new Error("network down"));
    const { useTasks } = await import("./useTasks");

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.state.status).toBe("error"));
    if (result.current.state.status === "error") {
      expect(result.current.state.error.message).toBe("network down");
    }
  });

  it("refetch reloads data and transitions through loading again", async () => {
    const { fetchTasks } = await import("../api/mockApi");
    vi.mocked(fetchTasks)
      .mockResolvedValueOnce(structuredClone(sampleTasks))
      .mockResolvedValueOnce([{ ...sampleTasks[0], title: "Updated" }]);
    const { useTasks } = await import("./useTasks");

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.state.status).toBe("success"));

    act(() => result.current.refetch());
    expect(result.current.state.status).toBe("loading");

    await waitFor(() => expect(result.current.state.status).toBe("success"));
    if (result.current.state.status === "success") {
      expect(result.current.state.tasks[0].title).toBe("Updated");
    }
    expect(fetchTasks).toHaveBeenCalledTimes(2);
  });

  it("serves a second mount from cache instead of refetching", async () => {
    const { fetchTasks } = await import("../api/mockApi");
    vi.mocked(fetchTasks).mockResolvedValue(structuredClone(sampleTasks));
    const { useTasks } = await import("./useTasks");

    const first = renderHook(() => useTasks());
    await waitFor(() => expect(first.result.current.state.status).toBe("success"));
    first.unmount();

    const second = renderHook(() => useTasks());
    expect(second.result.current.state.status).toBe("success");
    expect(second.result.current.state.tasks).toEqual(sampleTasks);
    expect(fetchTasks).toHaveBeenCalledTimes(1);
  });

  it("createTask prepends the newly created task once it resolves", async () => {
    const { fetchTasks, createTask } = await import("../api/mockApi");
    vi.mocked(fetchTasks).mockResolvedValue(structuredClone(sampleTasks));
    const newTask = { ...sampleTasks[0], id: "2", title: "New" };
    vi.mocked(createTask).mockResolvedValue(newTask);
    const { useTasks } = await import("./useTasks");

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.state.status).toBe("success"));

    await act(async () => {
      await result.current.createTask({
        title: "New",
        description: "",
        status: "todo",
        priority: "low",
        assignee: "Alice",
      });
    });

    if (result.current.state.status === "success") {
      expect(result.current.state.tasks.map((t) => t.id)).toEqual(["2", "1"]);
    }
  });

  it("updateTask replaces the matching task once it resolves", async () => {
    const { fetchTasks, updateTask } = await import("../api/mockApi");
    vi.mocked(fetchTasks).mockResolvedValue(structuredClone(sampleTasks));
    const updated = { ...sampleTasks[0], priority: "high" as const };
    vi.mocked(updateTask).mockResolvedValue(updated);
    const { useTasks } = await import("./useTasks");

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.state.status).toBe("success"));

    await act(async () => {
      await result.current.updateTask("1", { priority: "high" });
    });

    if (result.current.state.status === "success") {
      expect(result.current.state.tasks[0].priority).toBe("high");
    }
  });

  it("deleteTask removes the matching task once it resolves", async () => {
    const { fetchTasks, deleteTask } = await import("../api/mockApi");
    vi.mocked(fetchTasks).mockResolvedValue(structuredClone(sampleTasks));
    vi.mocked(deleteTask).mockResolvedValue(undefined);
    const { useTasks } = await import("./useTasks");

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.state.status).toBe("success"));

    await act(async () => {
      await result.current.deleteTask("1");
    });

    if (result.current.state.status === "success") {
      expect(result.current.state.tasks).toHaveLength(0);
    }
  });
});
