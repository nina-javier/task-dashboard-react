import type { Task } from "../types/task";

export type SortOrder = "newest" | "oldest";

export function sortTasks(tasks: Task[], order: SortOrder): Task[] {
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return order === "newest" ? sorted.reverse() : sorted;
}
