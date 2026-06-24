import type { Filters, TaskPriority, TaskStatus } from "../types/task";
import type { SortOrder } from "./sortTasks";

const STATUS_VALUES: TaskStatus[] = ["todo", "in-progress", "done"];
const PRIORITY_VALUES: TaskPriority[] = ["low", "medium", "high"];

function isStatus(value: string): value is TaskStatus {
  return (STATUS_VALUES as string[]).includes(value);
}

function isPriority(value: string): value is TaskPriority {
  return (PRIORITY_VALUES as string[]).includes(value);
}

export function readFiltersFromUrl(search: string = window.location.search): Filters {
  const params = new URLSearchParams(search);
  const status = (params.get("status")?.split(",") ?? []).filter(isStatus);
  const priority = (params.get("priority")?.split(",") ?? []).filter(isPriority);
  return { status, priority, assignee: params.get("assignee") };
}

export function writeFiltersToUrl(filters: Filters): void {
  const params = new URLSearchParams(window.location.search);
  setOrDeleteParam(params, "status", filters.status.length ? filters.status.join(",") : null);
  setOrDeleteParam(
    params,
    "priority",
    filters.priority.length ? filters.priority.join(",") : null,
  );
  setOrDeleteParam(params, "assignee", filters.assignee);
  replaceUrl(params);
}

export function readSortFromUrl(search: string = window.location.search): SortOrder {
  return new URLSearchParams(search).get("sort") === "oldest" ? "oldest" : "newest";
}

export function writeSortToUrl(order: SortOrder): void {
  const params = new URLSearchParams(window.location.search);
  setOrDeleteParam(params, "sort", order === "oldest" ? "oldest" : null);
  replaceUrl(params);
}

function setOrDeleteParam(params: URLSearchParams, key: string, value: string | null): void {
  if (value) params.set(key, value);
  else params.delete(key);
}

function replaceUrl(params: URLSearchParams): void {
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}
