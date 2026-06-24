import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useFilters } from "../context/FilterContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { Task, TaskPriority, TaskStatus } from "../types/task";

const STATUSES: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "todo", label: "To Do", dot: "bg-gray-400" },
  { value: "in-progress", label: "In Progress", dot: "bg-blue-500" },
  { value: "done", label: "Done", dot: "bg-green-500" },
];

const PRIORITIES: { value: TaskPriority; label: string; dot: string }[] = [
  { value: "high", label: "High", dot: "bg-red-500" },
  { value: "medium", label: "Medium", dot: "bg-orange-400" },
  { value: "low", label: "Low", dot: "bg-green-500" },
];

interface TaskFiltersProps {
  tasks: Task[];
}

export default function TaskFilters({ tasks }: TaskFiltersProps) {
  const { filters, toggleStatus, togglePriority, setAssignee, clear } = useFilters();
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const debouncedQuery = useDebouncedValue(assigneeQuery, 250);

  const assigneeOptions = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assignee))).sort(),
    [tasks],
  );

  const visibleAssignees = useMemo(
    () =>
      assigneeOptions.filter((name) =>
        name.toLowerCase().includes(debouncedQuery.trim().toLowerCase()),
      ),
    [assigneeOptions, debouncedQuery],
  );

  const statusCounts = useMemo(
    () =>
      STATUSES.map(({ value }) => tasks.filter((t) => t.status === value).length),
    [tasks],
  );

  const priorityCounts = useMemo(
    () =>
      PRIORITIES.map(({ value }) => tasks.filter((t) => t.priority === value).length),
    [tasks],
  );

  const hasActiveFilters =
    filters.status.length > 0 || filters.priority.length > 0 || filters.assignee !== null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clear}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>

      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-semibold text-gray-700">Status</legend>
        <div className="space-y-1">
          {STATUSES.map(({ value, label, dot }, i) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={filters.status.includes(value)}
                onChange={() => toggleStatus(value)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {statusCounts[i]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-semibold text-gray-700">Priority</legend>
        <div className="space-y-1">
          {PRIORITIES.map(({ value, label, dot }, i) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={filters.priority.includes(value)}
                onChange={() => togglePriority(value)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {priorityCounts[i]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-gray-700">Assignee</legend>
        <div className="relative mb-3">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search assignee"
            value={assigneeQuery}
            placeholder="Search assignee…"
            onChange={(e) => setAssigneeQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <input
              type="radio"
              name="assignee"
              checked={filters.assignee === null}
              onChange={() => setAssignee(null)}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            All
          </label>
          {visibleAssignees.map((name) => (
            <label
              key={name}
              className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="radio"
                name="assignee"
                checked={filters.assignee === name}
                onChange={() => setAssignee(name)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
