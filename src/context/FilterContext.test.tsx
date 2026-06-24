import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { FilterProvider, useFilters } from "./FilterContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <FilterProvider>{children}</FilterProvider>
);

describe("useFilters", () => {
  it("throws when used outside a FilterProvider", () => {
    expect(() => renderHook(() => useFilters())).toThrow(
      "useFilters must be used within a FilterProvider",
    );
  });

  it("starts with no constraints", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });
    expect(result.current.filters).toEqual({ status: [], priority: [], assignee: null });
  });

  it("toggleStatus adds then removes a status", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => result.current.toggleStatus("todo"));
    expect(result.current.filters.status).toEqual(["todo"]);

    act(() => result.current.toggleStatus("todo"));
    expect(result.current.filters.status).toEqual([]);
  });

  it("togglePriority adds then removes a priority", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => result.current.togglePriority("high"));
    expect(result.current.filters.priority).toEqual(["high"]);

    act(() => result.current.togglePriority("high"));
    expect(result.current.filters.priority).toEqual([]);
  });

  it("setAssignee is a no-op (same filters reference) when the value hasn't changed", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => result.current.setAssignee("Alice"));
    const filtersAfterFirstSet = result.current.filters;

    act(() => result.current.setAssignee("Alice"));
    // Regression check: an earlier version always returned a new object from
    // the reducer, which kept TaskFilters' debounce effect re-firing forever.
    expect(result.current.filters).toBe(filtersAfterFirstSet);
  });

  it("clear resets status, priority, and assignee", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.toggleStatus("done");
      result.current.togglePriority("low");
      result.current.setAssignee("Bob");
    });
    expect(result.current.filters).not.toEqual({ status: [], priority: [], assignee: null });

    act(() => result.current.clear());
    expect(result.current.filters).toEqual({ status: [], priority: [], assignee: null });
  });
});
