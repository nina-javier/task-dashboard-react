import { describe, expect, it } from "vitest";
import { filterTasks } from "./filterTasks";
import type { Task } from "../types/task";

const tasks: Task[] = [
  { id: "1", title: "A", description: "", status: "todo", priority: "high", assignee: "Alice", createdAt: "2026-01-01T00:00:00Z" },
  { id: "2", title: "B", description: "", status: "done", priority: "high", assignee: "Bob", createdAt: "2026-01-02T00:00:00Z" },
  { id: "3", title: "C", description: "", status: "todo", priority: "low", assignee: "Bob", createdAt: "2026-01-03T00:00:00Z" },
];

describe("filterTasks", () => {
  it("returns all tasks when filters are empty", () => {
    expect(filterTasks(tasks, { status: [], priority: [], assignee: null })).toHaveLength(3);
  });

  it("filters by status", () => {
    const result = filterTasks(tasks, { status: ["todo"], priority: [], assignee: null });
    expect(result.map((t) => t.id)).toEqual(["1", "3"]);
  });

  it("filters by priority", () => {
    const result = filterTasks(tasks, { status: [], priority: ["high"], assignee: null });
    expect(result.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("filters by assignee", () => {
    const result = filterTasks(tasks, { status: [], priority: [], assignee: "Bob" });
    expect(result.map((t) => t.id)).toEqual(["2", "3"]);
  });

  it("combines status, priority, and assignee filters", () => {
    const result = filterTasks(tasks, { status: ["todo"], priority: ["low"], assignee: "Bob" });
    expect(result.map((t) => t.id)).toEqual(["3"]);
  });
});
