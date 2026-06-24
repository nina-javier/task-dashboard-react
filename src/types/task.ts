export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  createdAt: string;
}

// Fields a user supplies when creating or editing a task — everything
// except the server-assigned id/createdAt.
export type TaskInput = Omit<Task, "id" | "createdAt">;

export interface Filters {
  status: TaskStatus[]; // multi-select; [] means "all"
  priority: TaskPriority[]; // multi-select; [] means "all"
  assignee: string | null; // single-select / search; null means "all"
}

export type TasksState =
  | { status: "loading"; tasks: []; error: null }
  | { status: "success"; tasks: Task[]; error: null }
  | { status: "error"; tasks: []; error: Error };
