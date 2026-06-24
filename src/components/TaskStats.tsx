import { useMemo } from "react";
import DonutChart from "./DonutChart";
import type { Task } from "../types/task";

interface TaskStatsProps {
  tasks: Task[];
}

const STATUS_ROWS: { value: Task["status"]; label: string; dot: string; stroke: string }[] = [
  { value: "todo", label: "To Do", dot: "bg-gray-400", stroke: "text-gray-300" },
  { value: "in-progress", label: "In Progress", dot: "bg-blue-500", stroke: "text-blue-500" },
  { value: "done", label: "Done", dot: "bg-green-500", stroke: "text-green-500" },
];

const PRIORITY_ROWS: { value: Task["priority"]; label: string; bar: string }[] = [
  { value: "high", label: "High", bar: "bg-red-500" },
  { value: "medium", label: "Medium", bar: "bg-orange-400" },
  { value: "low", label: "Low", bar: "bg-green-500" },
];

export default function TaskStats({ tasks }: TaskStatsProps) {
  const total = tasks.length;

  const statusCounts = useMemo(
    () => STATUS_ROWS.map(({ value }) => tasks.filter((t) => t.status === value).length),
    [tasks],
  );

  const priorityCounts = useMemo(
    () => PRIORITY_ROWS.map(({ value }) => tasks.filter((t) => t.priority === value).length),
    [tasks],
  );
  const maxPriorityCount = Math.max(1, ...priorityCounts);

  const assigneeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      counts.set(task.assignee, (counts.get(task.assignee) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Task Overview</h2>

        <div className="flex justify-center">
          <DonutChart
            total={total}
            centerValue={total}
            centerLabel="Total"
            segments={statusCounts.map((value, i) => ({
              value,
              colorClassName: STATUS_ROWS[i].stroke,
            }))}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {STATUS_ROWS.map(({ value, label, dot }, i) => (
            <li key={value} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
                {label}
              </span>
              <span className="font-medium text-gray-900">
                {statusCounts[i]}{" "}
                <span className="text-gray-400">
                  ({total === 0 ? 0 : Math.round((statusCounts[i] / total) * 100)}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-gray-900">By Priority</h2>
        <div className="space-y-3">
          {PRIORITY_ROWS.map(({ value, label, bar }, i) => (
            <div key={value}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-900">{priorityCounts[i]}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${bar}`}
                  style={{ width: `${(priorityCounts[i] / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-gray-900">By Assignee</h2>
        <ul className="space-y-2">
          {assigneeCounts.map(([name, count]) => (
            <li key={name} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{name}</span>
              <span className="font-medium text-gray-900">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
