# Project Requirement Prompt

---

## Overview
Complete a time-boxed React assessment - build a **Task Management Dashboard** in React + TypeScript that fetches, displays, filters, sorts and mutates tasks.

---

## Instructions

Work in a **spec-driven** way:

1. Read this entire PRP before writing code.
2. Build **phase by phase** (Phase 0-7). Do not start a phase until the previous phase passes its acceptance criteria.
3. At each phase gate, run the validation commands and self-check against the **Requirements Traceability Matrix** in §8.
4. Optimize for **correctness, type safety, and readable architecture** over visual polish. Do not over-engineer: choose the smallest tool that satisfies each requirement.
5. When a requirement is ambiguous, make the **principled** choice, implement it, and record the decision (one line) in `doc/NOTES.md`. Do not stall to ask.
6. For transparency, each prompt record it at **docs/AI_Usage.md**.

---

## 1. Tech Stack

| Concern | Choice | Rationale (carry into `doc/NOTES.md`) |
|---|---|---|
| Scaffold | **Vite + `react-ts` template** | CRA was officially deprecated by the React team in Feb 2025. The brief explicitly permits any scaffolder. Vite is the current standard: faster, simpler config, native ESM. |
| React | **React 19**, strict mode on | Canonical, stable behavior for the exact patterns under test (`React.memo`, `useMemo`, `useCallback`, `lazy`/`Suspense`, class Error Boundaries). If the scaffold pulls React 19 and nothing breaks, keep it; pin to 18 if you hit surprises. |
| Language | **TypeScript, `strict: true`** | The compiler is the first reviewer. **No `any`. No non-null `!` except at a documented trust boundary.** |
| Styling | **Plain CSS / CSS Modules**, one small stylesheet | Brief says basic styling suffices. No Tailwind setup, no component library — avoids dependency weight that would need justifying for zero grading upside. |
| Filter state | **React Context + `useReducer`** | Exactly the "Context" requirement for client-side filter state over a few thousand rows. |
| Data layer | **Custom `useTasks` hook** + module-level cache + `AbortController` | The brief *requires* a custom hook, so build the primitives by hand.
| Testing | **Vitest + React Testing Library + `@testing-library/jest-dom`**, `jsdom` env | Native fit with Vite; no separate Jest/Babel toolchain. |


---

## 2. Application Architecture

Create this structure.

```
src/
└── components/
   └── Dashboard.tsx
   └── TaskFilters.tsx
   └── TaskList.tsx
   └── TaskCard.tsx
   └── TaskStats.tsx
   └── ErrorBoundary.tsx
   └── VirtualList.tsx
   └── states
      └── LoadingState.tsx
      └── EmptyState.tsx
      └── ErrorState.tsx
└── context/
   └── FilterContext.tsx
└── hooks/
   └── useTasks.ts
   └── useDebouncedValue.ts
└── api/
   └── mockApi.ts
└── types/
   └── task.ts
└── test/
   └── setup.ts
└── utils/
   └── filterTasks.ts
App.tsx
main.tsx
index.css
```

---

## 3. Embedded Mock API (`src/api/mockApi.ts`)

Use this mock verbatim, then add an `AbortController`-aware fetch wrapper around
it so the data layer is production-shaped.

```typescript
import type { Task } from "../types/task";

const TASKS: Task[] = [
  { id: "1", title: "Design system tokens",  description: "Define color and spacing tokens", status: "in-progress", priority: "high",   assignee: "Alice",   createdAt: "2026-05-28T10:00:00Z" },
  { id: "2", title: "API integration",        description: "Connect to backend REST API",     status: "todo",        priority: "medium", assignee: "Bob",     createdAt: "2026-05-29T09:00:00Z" },
  { id: "3", title: "Unit tests",             description: "Write tests for hooks",           status: "done",        priority: "low",    assignee: "Alice",   createdAt: "2026-05-30T14:00:00Z" },
  { id: "4", title: "Performance audit",      description: "Run Lighthouse and fix issues",   status: "todo",        priority: "high",   assignee: "Charlie", createdAt: "2026-06-01T08:00:00Z" },
  { id: "5", title: "Accessibility review",   description: "Ensure WCAG 2.1 AA compliance",   status: "in-progress", priority: "medium", assignee: "Bob",     createdAt: "2026-06-01T11:00:00Z" },
];

export function fetchTasks(signal?: AbortSignal): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(structuredClone(TASKS)), 800);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export function updateTaskStatus(id: string, status: Task["status"]): Promise<Task> {
  return new Promise((resolve) =>
    setTimeout(() => {
      const task = TASKS.find((t) => t.id === id)!;
      resolve({ ...task, status });
    }, 300),
  );
}
```

### Notes

> `updateTaskStatus` should not mutate the source array — it returns a copy with the requested status and does not fail under normal operation. 
> The optimistic update flow must still be implemented correctly:
> - Apply the update locally.
> - Call the API.
> - Reconcile with the returned response.
> - Roll back if the request fails.
> Optional enhancement: Add a development-only failure injector (query parameter, feature flag, or mock override) to demonstrate rollback behavior and validate the error-handling path.

---

## 4. Type contracts (`src/types/task.ts`)

```typescript
export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  createdAt: string;
}

export interface Filters {
  status: TaskStatus[];     // multi-select; [] means "all"
  priority: TaskPriority[]; // multi-select; [] means "all"
  assignee: string | null;  // single-select / search; null means "all"
}

export type TasksState =
  | { status: "loading"; tasks: []; error: null }
  | { status: "success"; tasks: Task[]; error: null }
  | { status: "error";   tasks: []; error: Error };
```

> Reuse `TaskStatus`/`TaskPriority` everywhere (the mock's `Task["status"]` indexing must keep working). 
> Every component prop is explicitly typed; **`any` is forbidden** and will be treated as a defect.

---

### Pure filter contract (`src/utils/filterTasks.ts`)

```typescript
import type { Task, Filters } from "../types/task";

// Empty status/priority arrays and null assignee are treated as "no constraint".
export function filterTasks(tasks: Task[], filters: Filters): Task[] {
  return tasks.filter((t) => {
    const statusOk   = filters.status.length === 0   || filters.status.includes(t.status);
    const priorityOk = filters.priority.length === 0 || filters.priority.includes(t.priority);
    const assigneeOk = filters.assignee === null     || t.assignee === filters.assignee;
    return statusOk && priorityOk && assigneeOk;
  });
}
```

Keep this pure and dependency-free so the required test targets it directly.

## 5. UI/Visual Requirements

### Layout 

Create a professional Dashboard Layout with 3 columns:

1. (Left) Sidebar Filter (width: 20%)
2. (Center) Content Area: Task List (width: 60%)
3. (Right) Statistics Panel (width: 20%)

### Visual requirements:

- Clean spacing
- Card-based layout
- Responsive design
- Accessible controls
- Status badges
- Priority badges
- Add icons (using lucide-react)

### UI Library Dependencies

- lucide-react

---

## 6. Goal / Phase plan with acceptance criteria
Build in order. Each phase must satisfy **all** its criteria before moving on.

### Phase 0 — Scaffold & tooling
- `npm create vite@latest` with the `react-ts` template; install deps; add
  Vitest + RTL + jest-dom; configure `vitest` with `jsdom` and a setup file.
- Add scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`
  (`tsc --noEmit`). Enable `strict` and the `eslint-plugin-react-hooks` rules.
- **Done when:** `npm run dev`, `npm run build`, `npm run typecheck`,
  `npm run lint`, and `npm run test` all run without configuration errors.

### Phase 1 — Component architecture & TypeScript
- Implement the type contracts (§4) and render the exact tree: `App → Dashboard → { TaskFilters, TaskList → TaskCard, TaskStats }`.
- All props explicitly typed; `TaskCard` receives one `task: Task` plus a typed `onStatusChange` callback.
- **Done when:** tree renders with placeholder data, `typecheck` and `lint` are clean, and there is no `any` in the codebase.

### Phase 2 — Custom hook & data fetching
`useTasks()` must expose: `{ state, refetch, setStatus }` where `state` is the `TasksState` union.
- **Loading → success/error** lifecycle driven by `fetchTasks(signal)`.
- **Refetch** re-runs the fetch and busts the cache.
- **Optimistic update** via `setStatus(id, status)`: update local state immediately, call `updateTaskStatus`, reconcile on success, **roll back on rejection** (wire the dev-only failure injector from §3).
- **Caching:** a module-level cache so remounting the hook does not re-hit the 800 ms fetch. `refetch` ignores/refreshes the cache.
- **Cleanup:** abort the in-flight request on unmount; ignore `AbortError`; no state updates after unmount (no act/leak warnings).
- **Done when:** first mount shows loading then data; a second mount renders from cache instantly; `setStatus` reflects immediately and rolls back when the injector forces failure.

### Phase 3 — State management & Context
- `FilterContext` backed by `useReducer`; export a `useFilters()` hook that throws if used outside the provider.
- `TaskFilters` UI: **status** multi-select, **priority** multi-select, **assignee** single-select/search. Assignee options derive from the task data.
- Filters live entirely in context — **no prop drilling** of filter state.
- **Done when:** changing any control updates the visible list, and `TaskList` reads filters from context (not props).

### Phase 4 — Performance optimization
- `TaskCard` wrapped in **`React.memo`**. Its `onStatusChange` handler comes from a **`useCallback`** so memo actually holds when an unrelated filter changes.
- **`useMemo`** for the filtered list and for derived option lists (assignees).
- **Code splitting:** `TaskStats` is `React.lazy` + wrapped in `<Suspense>`.
- **Virtualization:** implement `VirtualList` (fixed row height, render only the visible window + small overscan) and use it in `TaskList`. Add a code comment explaining the **10,000+ task** strategy for variable-height rows.
- **Done when:** toggling a filter that doesn't change a given card's data does **not** re-render that card (prove it with a dev-only render counter or a
  comment referencing how you verified), and the `TaskStats` chunk loads lazily (visible as a separate chunk in `npm run build` output).

### Phase 5 — Error handling & edge cases
- **`ErrorBoundary`** (class component) wrapping `TaskList`, with a fallback UI and a reset action. Include a way to deliberately throw inside a card (dev
  flag) to demonstrate the boundary catches **render** errors.
- **Empty state:** when filters yield zero tasks, show a clear zero-state.
- **API failure:** `ErrorState` with a working **Retry** that calls `refetch`.
- **Rapid filter changes:** debounce the assignee **search** input
  (`useDebouncedValue`, ~250 ms); the fetch layer cancels stale requests via
  `AbortController` (already wired in Phase 2).
- **Done when:** forcing a render error shows the fallback (not a white screen);
  an over-constrained filter shows the zero-state; a forced fetch failure shows
  Retry, and Retry recovers.

### Phase 6 — Testing Recommendation
- Write **one meaningful** test that passes (see §7 for the recommended choice).
- **Done when:** `npm run test` is green and the test asserts real behavior.

### Phase 7 — Docs, disclosure & final review
- Write `doc/NOTES.md` (2–5 sentences) covering the key trade-offs (Vite over CRA, custom hook, custom windowing over a lib, class Error Boundary, client-side filtering + debounced search).
- Write `docs/AI_Usage.md` (see §10).
- Run the full **Definition of Done** (§9) and the traceability matrix (§8).

**Preferred order:**
> filterTasks unit test
> Verify filtering by status.
> Verify filtering by priority.
> Verify filtering by assignee.
> Verify combined filters.
> useTasks integration test
> Loading state transitions to success.
> Tasks are rendered after fetch completion.
> Optimistic update test
> Status updates immediately.
> Rolls back on failure when a failure injector is enabled.

---

## 8. Requirements Traceability Matrix

Tick every row once each of the tasks/phases are done. This is a self-review before declaring each as done.

| # | Brief requirement | Where implemented | Verified by |
|---|---|---|---|
| 1 | Exact component hierarchy | `components/*` | renders + visual tree |
| 2 | `Task` type + explicit prop types, no `any` | `types/task.ts`, all props | `typecheck`, grep for `any` |
| 3 | `useTasks` loading/error/success | `hooks/useTasks.ts` | smoke test |
| 4 | Refetch | `useTasks.refetch` | Retry button |
| 5 | Optimistic status update + rollback | `useTasks.setStatus` | failure injector demo |
| 6 | Cache avoids redundant fetch | module cache in `useTasks` | second-mount instant |
| 7 | Filter by status (multi) | `FilterContext` + `TaskFilters` | manual |
| 8 | Filter by priority (multi) | same | manual |
| 9 | Filter by assignee (single/search) | same + debounce | manual |
| 10 | No prop drilling of filters | `useFilters()` consumers | code review |
| 11 | `React.memo` / `useMemo` / `useCallback` | `TaskCard`, `TaskList` | render counter |
| 12 | 10k+ strategy explained + windowing | `VirtualList.tsx` + comment | code review |
| 13 | Code splitting via `lazy`/`Suspense` | `TaskStats` | build chunk output |
| 14 | Error Boundary around `TaskList` | `ErrorBoundary.tsx` | forced throw |
| 15 | Empty / failure / rapid-change handling | `states/*`, debounce, abort | manual |
| 16 | One meaningful test | `__tests__/` | `npm run test` |
| 17 | Compiles & runs cleanly | whole app | `build` + `dev` |
| 18 | `docs/NOTES.md` + AI disclosure | `docs/NOTES.md`, `docs/AI_Usage.md` | present |

---

## 9. Definition of Done (run all, all must pass)

```bash
npm run typecheck   # zero errors, no `any`
npm run lint        # zero errors/warnings, react-hooks/exhaustive-deps clean
npm run test        # green
npm run build       # succeeds; confirm TaskStats emits a separate chunk
npm run dev         # manual smoke test below
```

**Manual smoke test (browser):**
1. Load → loading indicator → 5 cards.
2. Apply status="todo" → only todo cards; clear → all return.
3. Search assignee "Alice" (debounced) → only Alice's cards.
4. Change a card's status → updates instantly (optimistic).
5. Flip the failure injector → status change rolls back; fetch failure shows
   Retry; Retry recovers.
6. Flip the error-throw flag → Error Boundary fallback (no white screen).
7. Over-constrain filters → zero-state UI.

Only report completion once every box in §8 and every command above passes.

---

## 10. AI disclosure deliverable (`docs/AI_Usage.md`)

The assessment's rules require this if AI was used. Generate it with threesections:

1. **Project Requirement Prompt (PRP) used** — Initial prompt used from `docs/PRP.md`; that file is the complete brief, architecture, and acceptance criteria given to the AI agent.
2. **Review mechanism** — describe the layered gate actually used:
   (a) TypeScript `strict` as the first reviewer (no `any`, no stray `!`);
   (b) ESLint with `react-hooks` rules (esp. `exhaustive-deps`);
   (c) the Vitest suite; 
   (d) the Requirements Traceability Matrix in §8 walked row by row; 
   (e) `npm run build` as the production gate; 
   (f) the manual smoke script in §9
3. **Justification of the implemented solution** — summarize the §1 rationale table: Vite over deprecated CRA; Context + `useReducer` for
   scale-appropriate filter state; a hand-written `useTasks` because the brief demands the custom-hook primitives; custom windowing to demonstrate the mechanism while avoiding an unjustified dependency; a class Error Boundary because hooks cannot catch
   render errors; client-side filtering with a debounced search because the dataset is small and that keeps interactions snappy.

---

## 11. Guardrails

- Do **not** add dependencies beyond Vitest/RTL/jest-dom without recording the justification in `doc/NOTES.md`. 
- Do **not** leave `console.log`, dead code, or commented-out blocks (except the intentional explanatory comments for virtualization).
- Prefer small, named, single-responsibility components and pure helpers.
- If a phase gate fails, fix it before continuing — never paper over a failing `typecheck`/`lint`/`test`.
- Final message back to the human: a short summary of what was built, the §8 matrix status, and any decisions logged in `doc/NOTES.md`.