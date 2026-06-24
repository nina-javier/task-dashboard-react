# Senior Frontend Developer — React Assessment

**Duration:** 60 minutes  
**Format:** Take-home coding exercise (single file or small project)

---

## Overview

Build a **Task Management Dashboard** that demonstrates your proficiency with core React concepts. You will implement a small application that fetches, displays, filters, and manages tasks.

---

## Setup

```bash
npx create-react-app task-dashboard --template typescript (you have the freedom to use any scaffolding tool)
cd task-dashboard
npm start
```

You may use any additional libraries you see fit (state management, styling, etc.), but be prepared to justify your choices.

---

## Requirements

### Task 1 — Component Architecture & TypeScript (10 min)

Create the following component hierarchy:

```
<App>
  <Dashboard>
    <TaskFilters />
    <TaskList>
      <TaskCard />
    </TaskList>
    <TaskStats />
  </Dashboard>
</App>
```

- Define a `Task` type:

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee: string;
  createdAt: string;
}
```

- Props must be explicitly typed. Avoid `any`.

---

### Task 2 — Custom Hook & Data Fetching (15 min)

Create a custom hook `useTasks` that:

1. Fetches tasks from a mock API (use the provided `mockApi.ts` below or your own mock).
2. Handles loading, error, and success states.
3. Supports refetching and optimistic updates when a task status changes.
4. Caches results to avoid redundant fetches on re-renders.

**Mock API (create `src/mockApi.ts`):**

```typescript
const TASKS: Task[] = [
  {
    id: "1",
    title: "Design system tokens",
    description: "Define color and spacing tokens",
    status: "in-progress",
    priority: "high",
    assignee: "Alice",
    createdAt: "2026-05-28T10:00:00Z",
  },
  {
    id: "2",
    title: "API integration",
    description: "Connect to backend REST API",
    status: "todo",
    priority: "medium",
    assignee: "Bob",
    createdAt: "2026-05-29T09:00:00Z",
  },
  {
    id: "3",
    title: "Unit tests",
    description: "Write tests for hooks",
    status: "done",
    priority: "low",
    assignee: "Alice",
    createdAt: "2026-05-30T14:00:00Z",
  },
  {
    id: "4",
    title: "Performance audit",
    description: "Run Lighthouse and fix issues",
    status: "todo",
    priority: "high",
    assignee: "Charlie",
    createdAt: "2026-06-01T08:00:00Z",
  },
  {
    id: "5",
    title: "Accessibility review",
    description: "Ensure WCAG 2.1 AA compliance",
    status: "in-progress",
    priority: "medium",
    assignee: "Bob",
    createdAt: "2026-06-01T11:00:00Z",
  },
];

export function fetchTasks(): Promise<Task[]> {
  return new Promise((resolve) => setTimeout(() => resolve(TASKS), 800));
}

export function updateTaskStatus(
  id: string,
  status: Task["status"],
): Promise<Task> {
  return new Promise((resolve) =>
    setTimeout(() => {
      const task = TASKS.find((t) => t.id === id)!;
      resolve({ ...task, status });
    }, 300),
  );
}
```

---

### Task 3 — State Management & Context (10 min)

Implement a **filter system** using React Context (or a state management solution of your choice):

- Filter by `status` (multi-select).
- Filter by `priority` (multi-select).
- Filter by `assignee` (single select or search).
- Filters must persist across component re-renders without prop drilling.

---

### Task 4 — Performance Optimization (10 min)

Demonstrate the following optimizations where appropriate:

1. **Memoization** — Use `React.memo`, `useMemo`, or `useCallback` to prevent unnecessary re-renders of `TaskCard` when filters change but the card's own data hasn't changed.
2. **Virtualization or Lazy Loading** — Explain (in a code comment) how you would handle 10,000+ tasks. Implement lazy rendering or a windowing approach if time allows.
3. **Code Splitting** — Lazy-load the `TaskStats` component using `React.lazy` and `Suspense`.

---

### Task 5 — Error Handling & Edge Cases (10 min)

1. Implement an **Error Boundary** that catches rendering errors in `TaskList` and displays a fallback UI.
2. Handle the following edge cases:
   - Empty task list (zero state UI).
   - API failure (show retry button).
   - Rapid filter changes (debounce or cancel stale requests).

---

### Task 6 — Testing (5 min)

Write **one** meaningful test (unit or integration) that validates a key behaviour. For example:

- `useTasks` returns loading then data.
- Filtering reduces the visible task count.
- Status change triggers optimistic update.

Use React Testing Library or a framework of your choice.

---

## Evaluation Focus

You will be assessed on:

| Area                                  | Weight |
| ------------------------------------- | ------ |
| Component design & TypeScript usage   | 20%    |
| Custom hooks & data fetching patterns | 20%    |
| State management approach             | 15%    |
| Performance awareness                 | 20%    |
| Error handling & resilience           | 15%    |
| Code quality & testing                | 10%    |

---

## Submission

- Provide a working repository or zip file.
- Include a brief `NOTES.md` (2–5 sentences) explaining any trade-offs or decisions you made.
- The app must compile and run with `npm start` without errors.

---

## Rules

- You may use the internet for API references (MDN, React docs, etc.).
- You can use AI to generate the code. If you used AI:
  - You have to provide the prompt/spec file
  - What sort of a review mechanism you have selected
  - You have to justify why you have select implemented solution
- Focus on quality and correctness over visual polish — basic styling is sufficient.

Good luck!
