import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Filters, TaskPriority, TaskStatus } from "../types/task";

type FilterAction =
  | { type: "TOGGLE_STATUS"; status: TaskStatus }
  | { type: "TOGGLE_PRIORITY"; priority: TaskPriority }
  | { type: "SET_ASSIGNEE"; assignee: string | null }
  | { type: "CLEAR" };

const initialFilters: Filters = {
  status: [],
  priority: [],
  assignee: null,
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function filterReducer(state: Filters, action: FilterAction): Filters {
  switch (action.type) {
    case "TOGGLE_STATUS":
      return { ...state, status: toggle(state.status, action.status) };
    case "TOGGLE_PRIORITY":
      return { ...state, priority: toggle(state.priority, action.priority) };
    case "SET_ASSIGNEE":
      return state.assignee === action.assignee ? state : { ...state, assignee: action.assignee };
    case "CLEAR":
      return initialFilters;
  }
}

interface FilterContextValue {
  filters: Filters;
  toggleStatus: (status: TaskStatus) => void;
  togglePriority: (priority: TaskPriority) => void;
  setAssignee: (assignee: string | null) => void;
  clear: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  // Stable function identities are required: TaskFilters' debounce effect
  // depends on `setAssignee`, so a new identity on every render would
  // re-fire that effect every render and loop forever.
  const toggleStatus = useCallback(
    (status: TaskStatus) => dispatch({ type: "TOGGLE_STATUS", status }),
    [],
  );
  const togglePriority = useCallback(
    (priority: TaskPriority) => dispatch({ type: "TOGGLE_PRIORITY", priority }),
    [],
  );
  const setAssignee = useCallback(
    (assignee: string | null) => dispatch({ type: "SET_ASSIGNEE", assignee }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const value = useMemo<FilterContextValue>(
    () => ({ filters, toggleStatus, togglePriority, setAssignee, clear }),
    [filters, toggleStatus, togglePriority, setAssignee, clear],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

// PRP §2 colocates the provider and its hook in one file; that's a known
// false positive for the fast-refresh rule in context+hook patterns.
// eslint-disable-next-line react-refresh/only-export-components
export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return ctx;
}
