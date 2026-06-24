import type { Task, Filters } from "../types/task";

// Empty status/priority arrays and null assignee are treated as "no constraint".
export function filterTasks(tasks: Task[], filters: Filters): Task[] {
  return tasks.filter((t) => {
    const statusOk = filters.status.length === 0 || filters.status.includes(t.status);
    const priorityOk = filters.priority.length === 0 || filters.priority.includes(t.priority);
    const assigneeOk = filters.assignee === null || t.assignee === filters.assignee;
    return statusOk && priorityOk && assigneeOk;
  });
}
