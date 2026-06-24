import { lazy, Suspense, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import TaskFilters from "./TaskFilters";
import TaskList from "./TaskList";
import ErrorBoundary from "./ErrorBoundary";
import LoadingState from "./states/LoadingState";
import EmptyState from "./states/EmptyState";
import ErrorState from "./states/ErrorState";
import { useTasks } from "../hooks/useTasks";
import { useFilters } from "../context/FilterContext";
import { filterTasks } from "../utils/filterTasks";
import { sortTasks, type SortOrder } from "../utils/sortTasks";
import type { Filters, Task, TaskStatus } from "../types/task";

const TaskStats = lazy(() => import("./TaskStats"));

export default function Dashboard() {
  const { state, refetch, setStatus } = useTasks();
  const { filters } = useFilters();

  if (state.status === "loading") {
    return <LoadingState />;
  }

  if (state.status === "error") {
    return <ErrorState message={state.error.message} onRetry={refetch} />;
  }

  return (
    <DashboardContent
      tasks={state.tasks}
      filters={filters}
      onStatusChange={setStatus}
    />
  );
}

interface DashboardContentProps {
  tasks: Task[];
  filters: Filters;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function DashboardContent({ tasks, filters, onStatusChange }: DashboardContentProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const sortedTasks = useMemo(
    () => sortTasks(visibleTasks, sortOrder),
    [visibleTasks, sortOrder],
  );

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6 lg:flex-row lg:items-start">
      <div className="w-full flex-shrink-0 lg:w-[20%]">
        <TaskFilters tasks={tasks} />
      </div>

      <div className="w-full flex-1 lg:w-[60%]">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
              <span className="text-sm text-gray-500">
                {sortedTasks.length} task{sortedTasks.length === 1 ? "" : "s"}
              </span>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-500">
              Sort by
              <span className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="cursor-pointer appearance-none rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="newest">Created: Newest</option>
                  <option value="oldest">Created: Oldest</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </label>
          </div>

          <ErrorBoundary>
            {sortedTasks.length === 0 ? (
              <EmptyState />
            ) : (
              <TaskList tasks={sortedTasks} onStatusChange={onStatusChange} />
            )}
          </ErrorBoundary>

          {sortedTasks.length > 0 && (
            <p className="mt-4 text-center text-sm text-gray-500">
              Showing 1 to {sortedTasks.length} of {sortedTasks.length} tasks
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex-shrink-0 lg:w-[20%]">
        <Suspense fallback={<LoadingState />}>
          <TaskStats tasks={sortedTasks} />
        </Suspense>
      </div>
    </div>
  );
}
