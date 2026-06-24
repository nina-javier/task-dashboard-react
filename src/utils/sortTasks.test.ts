import { describe, expect, it } from "vitest";
import { sortTasks } from "./sortTasks";
import type { Task } from "../types/task";

const tasks: Task[] = [
  { id: "1", title: "A", description: "", status: "todo", priority: "low", assignee: "Alice", createdAt: "2026-01-02T00:00:00Z" },
  { id: "2", title: "B", description: "", status: "todo", priority: "low", assignee: "Alice", createdAt: "2026-01-03T00:00:00Z" },
  { id: "3", title: "C", description: "", status: "todo", priority: "low", assignee: "Alice", createdAt: "2026-01-01T00:00:00Z" },
];

describe("sortTasks", () => {
  it("orders newest createdAt first", () => {
    expect(sortTasks(tasks, "newest").map((t) => t.id)).toEqual(["2", "1", "3"]);
  });

  it("orders oldest createdAt first", () => {
    expect(sortTasks(tasks, "oldest").map((t) => t.id)).toEqual(["3", "1", "2"]);
  });

  it("does not mutate the input array", () => {
    const original = [...tasks];
    sortTasks(tasks, "newest");
    expect(tasks).toEqual(original);
  });

  it("handles an empty list", () => {
    expect(sortTasks([], "newest")).toEqual([]);
  });
});
