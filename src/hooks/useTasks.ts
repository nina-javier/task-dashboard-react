import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTasks, updateTaskStatus } from "../api/mockApi";
import type { Task, TaskStatus, TasksState } from "../types/task";

// Module-level cache so remounting the hook doesn't re-trigger the 800ms
// fetch. `refetch` bypasses/refreshes it explicitly.
let cachedTasks: Task[] | null = null;

export interface UseTasksResult {
  state: TasksState;
  refetch: () => void;
  setStatus: (id: string, status: TaskStatus) => void;
}

export function useTasks(): UseTasksResult {
  const [state, setState] = useState<TasksState>(() =>
    cachedTasks
      ? { status: "success", tasks: cachedTasks, error: null }
      : { status: "loading", tasks: [], error: null },
  );
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  // Performs the fetch and resolves state asynchronously only — callers
  // that need an immediate "loading" transition (e.g. refetch) set that
  // themselves before invoking this, since setting state synchronously
  // inside an effect body is the anti-pattern this hook avoids.
  const load = useCallback((signal: AbortSignal) => {
    fetchTasks(signal)
      .then((tasks) => {
        if (!mountedRef.current) return;
        cachedTasks = tasks;
        setState({ status: "success", tasks, error: null });
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          status: "error",
          tasks: [],
          error: err instanceof Error ? err : new Error("Failed to fetch tasks"),
        });
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    // The initial state already reads `cachedTasks` synchronously, so only
    // hit the network when there's nothing cached yet.
    if (!cachedTasks) {
      load(controller.signal);
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [load]);

  const refetch = useCallback(() => {
    cachedTasks = null;
    setState({ status: "loading", tasks: [], error: null });
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    load(controller.signal);
  }, [load]);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    setState((prev) => {
      if (prev.status !== "success") return prev;
      const previousTasks = prev.tasks;
      const optimisticTasks = previousTasks.map((t) =>
        t.id === id ? { ...t, status } : t,
      );
      cachedTasks = optimisticTasks;

      updateTaskStatus(id, status)
        .then((updated) => {
          if (!mountedRef.current) return;
          setState((current) => {
            if (current.status !== "success") return current;
            const reconciled = current.tasks.map((t) =>
              t.id === updated.id ? updated : t,
            );
            cachedTasks = reconciled;
            return { status: "success", tasks: reconciled, error: null };
          });
        })
        .catch(() => {
          if (!mountedRef.current) return;
          // Roll back to the pre-optimistic snapshot on rejection.
          cachedTasks = previousTasks;
          setState({ status: "success", tasks: previousTasks, error: null });
        });

      return { status: "success", tasks: optimisticTasks, error: null };
    });
  }, []);

  return { state, refetch, setStatus };
}
