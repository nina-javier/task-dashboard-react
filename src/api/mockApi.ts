import type { Task } from "../types/task";
import { isLargeDatasetEnabled, isFailureInjectorEnabled } from "../devFlags";
import mockData from "./data/mockData.json";

const TASKS = mockData as Task[];

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
  return isLargeDatasetEnabled() ? loadLargeDataset() : TASKS;
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
