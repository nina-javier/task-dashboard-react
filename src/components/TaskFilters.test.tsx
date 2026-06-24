import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TaskFilters from "./TaskFilters";
import { FilterProvider } from "../context/FilterContext";
import type { Task } from "../types/task";

const tasks: Task[] = [
  { id: "1", title: "A", description: "", status: "todo", priority: "high", assignee: "Alice", createdAt: "2026-01-01T00:00:00Z" },
  { id: "2", title: "B", description: "", status: "done", priority: "low", assignee: "Bob", createdAt: "2026-01-02T00:00:00Z" },
  { id: "3", title: "C", description: "", status: "todo", priority: "high", assignee: "Charlie", createdAt: "2026-01-03T00:00:00Z" },
];

function renderFilters() {
  return render(
    <FilterProvider>
      <TaskFilters tasks={tasks} />
    </FilterProvider>,
  );
}

describe("TaskFilters", () => {
  it("derives status and priority counts from the full task list", () => {
    renderFilters();
    // "To Do" = 2, "Done" = 1, "High" = 2, "Low" = 1.
    const todoLabel = screen.getByText("To Do").closest("label");
    const doneLabel = screen.getByText("Done").closest("label");
    const highLabel = screen.getByText("High").closest("label");
    const lowLabel = screen.getByText("Low").closest("label");
    expect(todoLabel).toHaveTextContent("2");
    expect(doneLabel).toHaveTextContent("1");
    expect(highLabel).toHaveTextContent("2");
    expect(lowLabel).toHaveTextContent("1");
  });

  it("lists assignees derived from the task list, sorted, with 'All' selected by default", () => {
    renderFilters();
    expect(screen.getByRole("radio", { name: "All" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Bob" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Charlie" })).toBeInTheDocument();
  });

  it("toggling a status checkbox checks it and reveals 'Clear all'", () => {
    renderFilters();
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /To Do/ }));

    expect(screen.getByRole("checkbox", { name: /To Do/ })).toBeChecked();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("selecting an assignee radio deselects 'All'", () => {
    renderFilters();

    fireEvent.click(screen.getByRole("radio", { name: "Bob" }));

    expect(screen.getByRole("radio", { name: "Bob" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).not.toBeChecked();
  });

  it("'Clear all' resets every filter back to its default", () => {
    renderFilters();
    fireEvent.click(screen.getByRole("checkbox", { name: /To Do/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /High/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Bob" }));

    fireEvent.click(screen.getByText("Clear all"));

    expect(screen.getByRole("checkbox", { name: /To Do/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /High/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).toBeChecked();
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  describe("debounced assignee search", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("narrows the assignee radio list after the debounce delay", () => {
      renderFilters();

      fireEvent.change(screen.getByLabelText("Search assignee"), {
        target: { value: "ali" },
      });

      // Not yet narrowed — the debounce hasn't elapsed.
      expect(screen.getByRole("radio", { name: "Bob" })).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(250));

      expect(screen.getByRole("radio", { name: "Alice" })).toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: "Bob" })).not.toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: "Charlie" })).not.toBeInTheDocument();
      // "All" is always shown regardless of the search query.
      expect(screen.getByRole("radio", { name: "All" })).toBeInTheDocument();
    });
  });
});
