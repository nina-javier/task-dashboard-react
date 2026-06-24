import type { Task, TaskInput } from "../types/task";
import { isLargeDatasetEnabled, isFailureInjectorEnabled } from "../devFlags";
import mockData from "./data/mockData.json";

// Mutable, seeded from the JSON fixture. create/update/delete mutate this
// directly so changes persist for the session (e.g. survive a refetch) —
// unlike `updateTaskStatus` below, which intentionally does not mutate it.
let store: Task[] = structuredClone(mockData) as Task[];

// Dev-only: ?syntheticTasks=1 swaps the 5-row mock for a static 1,000-row
// dataset so VirtualList's windowing is actually exercised, not just trusted
// by inspection. Dynamically imported so the 1k-row JSON never bloats the
// production bundle for an app that ships the 5-row dataset.
let cachedLargeDataset: Task[] | null = null;
async function loadLargeDataset(): Promise<Task[]> {
  if (!cachedLargeDataset) {
    const mod = await import("./data/mockData_1k.json");
    cachedLargeDataset = mod.default as Task[];
  }
  return cachedLargeDataset;
}

async function resolveTaskPool(): Promise<Task[]> {
  return isLargeDatasetEnabled() ? loadLargeDataset() : store;
}

export function fetchTasks(signal?: AbortSignal): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    let aborted = false;
    signal?.addEventListener("abort", () => {
      aborted = true;
      reject(new DOMException("Aborted", "AbortError"));
    });

    resolveTaskPool().then((data) => {
      if (aborted) return;
      const t = setTimeout(() => resolve(structuredClone(data)), 800);
      signal?.addEventListener("abort", () => clearTimeout(t));
    });
  });
}

export function updateTaskStatus(id: string, status: Task["status"]): Promise<Task> {
  return resolveTaskPool().then(
    (pool) =>
      new Promise((resolve, reject) =>
        setTimeout(() => {
          if (isFailureInjectorEnabled()) {
            reject(new Error("Simulated update failure (dev failure injector)"));
            return;
          }
          const task = pool.find((t) => t.id === id) ?? {
            id,
            title: "",
            description: "",
            status,
            priority: "low" as const,
            assignee: "",
            createdAt: new Date().toISOString(),
          };
          resolve({ ...task, status });
        }, 300),
      ),
  );
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// create/update/delete always operate on the default `store`, not the
// large synthetic dataset — that fixture exists purely for the
// virtualization demo and isn't meant to be edited.
export function createTask(input: TaskInput): Promise<Task> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const task: Task = { ...input, id: generateId(), createdAt: new Date().toISOString() };
      store = [task, ...store];
      resolve(structuredClone(task));
    }, 300);
  });
}

export function updateTask(id: string, updates: Partial<TaskInput>): Promise<Task> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = store.find((t) => t.id === id);
      if (!existing) {
        reject(new Error(`Task ${id} not found`));
        return;
      }
      const updated: Task = { ...existing, ...updates };
      store = store.map((t) => (t.id === id ? updated : t));
      resolve(structuredClone(updated));
    }, 300);
  });
}

export function deleteTask(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!store.some((t) => t.id === id)) {
        reject(new Error(`Task ${id} not found`));
        return;
      }
      store = store.filter((t) => t.id !== id);
      resolve();
    }, 300);
  });
}
