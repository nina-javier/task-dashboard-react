# Task Dashboard

A React + TypeScript take-home assessment: a Task Management Dashboard that
fetches, displays, filters, sorts, and optimistically mutates tasks against a
mock API.

- **Component tree:** `App → Dashboard → { TaskFilters, TaskList → TaskCard, TaskStats }`,
  plus a `Header` bar and a class `ErrorBoundary` wrapping the list.
- **Data layer:** a hand-written `useTasks` hook — loading/error/success
  states, a module-level cache, `AbortController` cancellation, and an
  optimistic status update with rollback on failure.
- **Filtering:** status (multi-select) and priority (multi-select) checkboxes,
  plus an assignee single-select narrowed by a debounced search box — all
  driven by `FilterContext` (`useReducer`), no prop drilling.
- **Performance:** `React.memo`/`useMemo`/`useCallback` on the card list, a
  hand-built `VirtualList` for windowed rendering, and `TaskStats` code-split
  via `React.lazy`/`Suspense`.

The full spec this was built against is in [`doc/PRP.md`](doc/PRP.md); the
original assessment brief is in [`doc/Assessment-Readme.md`](doc/Assessment-Readme.md).

## Running it

Prerequisites: Node 18+ and npm.

```bash
npm install
npm run dev         # http://localhost:5173
npm run test        # Vitest (unit + integration)
npm run typecheck   # tsc -b, strict
npm run lint        # eslint, react-hooks rules included
npm run build       # production build (confirms TaskStats + the 1k dataset
                     # emit as separate chunks)
```

No backend, no env vars. Tasks are served from a mock API
(`src/api/mockApi.ts`) with simulated network latency (800ms fetch, 300ms
update).

## Structure

```
src/
  types/task.ts        Task, Filters, TasksState
  api/
    mockApi.ts          fetchTasks / updateTaskStatus (AbortController-aware)
    data/
      mockData.json     the 5-task fixture
      mockData_1k.json  1,000-row fixture, dynamically imported only when
                         the large-dataset dev flag is on
  hooks/
    useTasks.ts         cache + abort + optimistic update/rollback
    useDebouncedValue.ts
  context/
    FilterContext.tsx   useReducer + useFilters() (throws outside provider)
  utils/
    filterTasks.ts      pure filter predicate (unit tested)
    sortTasks.ts        pure sort by createdAt
  components/
    Dashboard.tsx, Header.tsx, TaskFilters.tsx, TaskList.tsx, TaskCard.tsx,
    TaskStats.tsx, DonutChart.tsx, VirtualList.tsx, ErrorBoundary.tsx
    states/             LoadingState, EmptyState, ErrorState
  devFlags.ts            URL-query-param dev toggles (see below)
```

`filterTasks` and `sortTasks` are kept pure and dependency-free so they're
cheap to unit test and reusable wherever the task list needs to be derived.

## Dev-only flags

All toggles read the URL query string (`src/devFlags.ts`) and have no effect
unless set — they exist to demonstrate behaviour that's otherwise hard to
trigger from the UI alone:

| Flag | Effect |
|---|---|
| `?failTasks=1` | `updateTaskStatus` rejects, so `setStatus` rolls back its optimistic update. |
| `?throwRender=1` | The first `TaskCard` throws during render, so the `ErrorBoundary` fallback (with a working reset) is visible. |
| `?renderCounter=1` | Each `TaskCard` logs its own render count, to verify `React.memo` holds when an unrelated filter changes. |
| `?syntheticTasks=1` | Swaps the 5-task fixture for the 1,000-row `mockData_1k.json`, to verify `VirtualList` actually windows a large list instead of just rendering everything. |

## Decisions

- **Vite, not CRA.** CRA is deprecated; Vite gives faster dev/build with no
  extra config for React 19 + TypeScript `strict`.
- **Custom `useTasks` hook**, not a data-fetching library. The brief requires
  the cache/abort/optimistic-update primitives to be hand-built.
- **Context + `useReducer` for filters**, not a state-management library — one
  small, app-wide slice of UI state over a few thousand rows doesn't need
  more.
- **Custom `VirtualList`**, not `react-window`/`react-virtual`. Demonstrates
  the windowing mechanism directly; a comment in `VirtualList.tsx` explains
  the harder variable-height strategy real 10,000+ row data with non-uniform
  card heights would need (a measured-height cache + cumulative offsets +
  `ResizeObserver`), which isn't implemented since this app's cards are a
  uniform height.
- **Class `ErrorBoundary`.** Hooks can't catch render errors thrown by
  descendants — only `getDerivedStateFromError`/`componentDidCatch` can.
- **Client-side filtering, debounced assignee search.** The dataset is small
  enough that filtering in-memory keeps interactions instant; the debounce
  just keeps a context dispatch from firing on every keystroke.
- **Tailwind CSS.** Added after the initial build, at explicit request, to
  match a supplied visual mockup (header bar, filter facet counts, sort
  control, donut-chart stats panel). Superseded the original plain-CSS
  choice — see `doc/NOTES.md`.
- **Mock data as JSON fixtures**, not inlined arrays. `mockData_1k.json` is
  loaded via a dynamic `import()` (cached after first load) so it never
  ships in the default production bundle.

Full trade-off log, including ambiguous-requirement calls made during the
build, is in [`doc/NOTES.md`](doc/NOTES.md). AI usage disclosure (per the
assessment rules) is in [`doc/AI_Usage.md`](doc/AI_Usage.md).

## Testing

Targeted, not exhaustive — per the assessment's "one meaningful test"
minimum, slightly exceeded:

- `filterTasks.test.ts` — status, priority, assignee, and combined filtering.
- `useTasks.test.tsx` — loading → success transition; optimistic update that
  rolls back on a mocked rejection.

## Assumptions

- The assignee filter is a single-select (radio: `All` + each name), with a
  debounced search box that narrows the radio list rather than filtering
  tasks directly by free text — matching the supplied mockup while still
  satisfying the brief's "single-select or search" requirement.
- Sorting (`Created: Newest`/`Created: Oldest`) is local UI state, not part of
  `FilterContext` — it doesn't need to be shared or persisted, just applied
  after filtering.
- The "..." per-card menu and the header's user/avatar control are visual
  affordances from the mockup; no menu actions or auth are in scope.

## Trade-offs / what's next

Built to the PRP's phase-gated scope, so depth was favoured over breadth.
Deferred:

- Variable-height virtualization (only fixed-height rows are implemented;
  see the comment in `VirtualList.tsx`).
- Persisting filter/sort state (e.g. to the URL) across reloads.
- Real status-change actions behind the card's "..." menu.
- A real backend — `mockApi.ts` is an in-memory fixture for the session only.
