import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTasks, updateTaskStatus } from "./mockApi";
import mockData from "./data/mockData.json";

function setSearch(search: string) {
  window.history.pushState({}, "", search);
}

afterEach(() => {
  setSearch("/");
});

describe("fetchTasks", () => {
  it("resolves with the default 5-task dataset after the simulated delay", async () => {
    vi.useFakeTimers();
    const promise = fetchTasks();
    await vi.advanceTimersByTimeAsync(800);
    vi.useRealTimers();
    await expect(promise).resolves.toEqual(mockData);
  });

  it("resolves with the 1,000-row dataset when the large-dataset flag is set", async () => {
    // Real timers: the 1k dataset is loaded via a dynamic import, which goes
    // through real async module resolution that fake timers don't drive.
    setSearch("/?syntheticTasks=1");
    const result = await fetchTasks();
    expect(result).toHaveLength(1000);
  });

  it("rejects with AbortError when the signal aborts before the fetch settles", async () => {
    const controller = new AbortController();
    const promise = fetchTasks(controller.signal);
    const assertion = expect(promise).rejects.toThrow("Aborted");
    controller.abort();
    await assertion;
  });
});

describe("updateTaskStatus", () => {
  it("resolves with the requested status for an existing task", async () => {
    vi.useFakeTimers();
    const promise = updateTaskStatus("1", "done");
    await vi.advanceTimersByTimeAsync(300);
    vi.useRealTimers();
    const result = await promise;
    expect(result.id).toBe("1");
    expect(result.status).toBe("done");
  });

  it("does not mutate the source dataset", async () => {
    vi.useFakeTimers();
    const promise = updateTaskStatus("1", "done");
    await vi.advanceTimersByTimeAsync(300);
    vi.useRealTimers();
    await promise;
    expect(mockData.find((t) => t.id === "1")?.status).toBe("in-progress");
  });

  it("falls back to a constructed task for an unknown id", async () => {
    vi.useFakeTimers();
    const promise = updateTaskStatus("does-not-exist", "todo");
    await vi.advanceTimersByTimeAsync(300);
    vi.useRealTimers();
    const result = await promise;
    expect(result).toEqual({
      id: "does-not-exist",
      title: "",
      description: "",
      status: "todo",
      priority: "low",
      assignee: "",
      createdAt: expect.any(String),
    });
  });

  it("rejects when the failure injector flag is set", async () => {
    setSearch("/?failTasks=1");
    vi.useFakeTimers();
    const promise = updateTaskStatus("1", "done");
    const assertion = expect(promise).rejects.toThrow("Simulated update failure");
    await vi.advanceTimersByTimeAsync(300);
    vi.useRealTimers();
    await assertion;
  });
});

// create/update/delete mutate the module-level `store`, so each test gets a
// fresh module instance via resetModules + a dynamic import — otherwise one
// test's mutation would leak into the next (the describe blocks above use
// static imports, which keep their own separate, never-reset instance).
describe("createTask / updateTask / deleteTask", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("createTask adds a new task with a generated id and createdAt", async () => {
    const { createTask, fetchTasks: fetch2 } = await import("./mockApi");
    const created = await createTask({
      title: "New task",
      description: "desc",
      status: "todo",
      priority: "medium",
      assignee: "Dana",
    });

    expect(created.title).toBe("New task");
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();

    const all = await fetch2();
    expect(all.some((t) => t.id === created.id)).toBe(true);
    expect(all).toHaveLength(6);
  });

  it("updateTask applies a partial update and persists it across a later fetch", async () => {
    const { updateTask, fetchTasks: fetch2 } = await import("./mockApi");
    const updated = await updateTask("1", { priority: "low", assignee: "Charlie" });

    expect(updated.id).toBe("1");
    expect(updated.priority).toBe("low");
    expect(updated.assignee).toBe("Charlie");
    expect(updated.title).toBe("Design system tokens"); // untouched fields survive

    const all = await fetch2();
    expect(all.find((t) => t.id === "1")?.assignee).toBe("Charlie");
  });

  it("updateTask rejects for an unknown id", async () => {
    const { updateTask } = await import("./mockApi");
    await expect(updateTask("does-not-exist", { priority: "high" })).rejects.toThrow(
      "not found",
    );
  });

  it("deleteTask removes the task so it's absent from a later fetch", async () => {
    const { deleteTask, fetchTasks: fetch2 } = await import("./mockApi");
    await deleteTask("2");

    const all = await fetch2();
    expect(all.some((t) => t.id === "2")).toBe(false);
    expect(all).toHaveLength(4);
  });

  it("deleteTask rejects for an unknown id", async () => {
    const { deleteTask } = await import("./mockApi");
    await expect(deleteTask("does-not-exist")).rejects.toThrow("not found");
  });
});
