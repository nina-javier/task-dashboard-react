import { memo } from "react";
import { Calendar, MoreHorizontal, User } from "lucide-react";
import type { Task, TaskStatus } from "../types/task";
import { isRenderCounterEnabled, isRenderErrorEnabled } from "../devFlags";

const STATUS_DOT: Record<TaskStatus, string> = {
  todo: "bg-gray-400",
  "in-progress": "bg-blue-500",
  done: "bg-green-500",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const PRIORITY_BADGE: Record<Task["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-green-100 text-green-700",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

// Dev-only proof that React.memo holds: with ?renderCounter=1, each card
// logs its own render count. Toggling an unrelated filter should NOT bump a
// given card's count, since its `task` and `onStatusChange` props are
// referentially unchanged (the latter via useCallback in useTasks).
// Module-level (not a ref) since it's instrumentation, not render output.
const renderCounts = new Map<string, number>();

function TaskCard({ task, onStatusChange }: TaskCardProps) {
  // Dev-only proof that ErrorBoundary catches render errors: ?throwRender=1
  // makes the first card throw during render instead of returning JSX.
  if (isRenderErrorEnabled() && task.id === "1") {
    throw new Error("Simulated render error (dev render-error flag)");
  }

  if (isRenderCounterEnabled()) {
    const count = (renderCounts.get(task.id) ?? 0) + 1;
    renderCounts.set(task.id, count);
    console.log(`TaskCard[${task.id}] render #${count}`);
  }

  return (
    <div className="task-card flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
            aria-hidden="true"
          />
          <h3 className="truncate font-semibold text-gray-900">{task.title}</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">{task.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_BADGE[task.priority]}`}
          >
            {task.priority}
          </span>
          <select
            aria-label={`Change status for ${task.title}`}
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className={`cursor-pointer rounded-md border-0 px-2 py-0.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${STATUS_BADGE[task.status]}`}
          >
            <option value="todo">{STATUS_LABEL.todo}</option>
            <option value="in-progress">{STATUS_LABEL["in-progress"]}</option>
            <option value="done">{STATUS_LABEL.done}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <button
          type="button"
          aria-label={`More actions for ${task.title}`}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <MoreHorizontal size={18} />
        </button>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <User size={14} aria-hidden="true" />
          {task.assignee}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar size={14} aria-hidden="true" />
          {DATE_FORMATTER.format(new Date(task.createdAt))}
        </span>
      </div>
    </div>
  );
}

export default memo(TaskCard);
