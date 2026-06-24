import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types/task";

const sampleTasks: Task[] = [
  { id: "1", title: "A", description: "", status: "todo", priority: "low", assignee: "Alice", createdAt: "2026-01-01T00:00:00Z" },
];

vi.mock("../api/mockApi", () => ({
  fetchTasks: vi.fn(),
  updateTaskStatus: vi.fn(),
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
});
