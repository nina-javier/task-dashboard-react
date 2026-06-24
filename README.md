# Task Dashboard

A React + TypeScript take-home assessment: a Task Management Dashboard that
fetches, displays, filters, sorts, and optimistically mutates tasks against a
mock API.

- **Component tree:** `App → Dashboard → { TaskFilters, TaskList → TaskCard, TaskStats }`,
  plus a `Header` bar and a class `ErrorBoundary` wrapping the list.
- **Data layer:** a hand-written `useTasks` hook — loading/error/success
  states, a module-level cache, `AbortController` cancellation, an optimistic
  status update with rollback on failure, and full create/update/delete
  against a real (in-memory) mutable store.
- **Task CRUD:** a "Create Task" button in the header and a pencil icon on
  each card open the same modal (create, or pre-filled for edit); deleting
  goes through a confirmation dialog; create/save/delete each confirm via a
  bottom-of-screen snackbar.
- **Filtering:** status (multi-select) and priority (multi-select) checkboxes,
  plus an assignee single-select narrowed by a debounced search box — all
  driven by `FilterContext` (`useReducer`), no prop drilling.
- **Performance:** `React.memo`/`useMemo`/`useCallback` on the card list, a
  hand-built `VirtualList` for windowed rendering, and `TaskStats` *and*
  `TaskModal`/`ConfirmDialog`/`Snackbar` code-split via `React.lazy`/`Suspense`
  (the latter three only ever mount once a modal/dialog/toast is triggered).
- **Persistence:** filters and sort order are synced to the URL query string
  (`src/utils/urlState.ts`), so reloading or sharing a link preserves them —
  no router dependency, just `URLSearchParams` + `history.replaceState`.

The full spec this was built against is in [`doc/PRP.md`](doc/PRP.md); the
original assessment brief is in [`doc/Assessment-Readme.md`](doc/Assessment-Readme.md).

## Running it

Prerequisites: Node 18+ and npm.

```bash
npm install
npm run dev         # http://localhost:5173
npm run start       # http://localhost:5173
npm run test        # Vitest (unit + integration)
npm run typecheck   # tsc -b, strict
npm run lint        # eslint, react-hooks rules included
npm run build       # production build (confirms TaskStats, the modal/dialog/
                     # snackbar components, and the 1k dataset each emit as
                     # separate chunks)
```

No backend, no env vars. Tasks are served from a mock API
(`src/api/mockApi.ts`) with simulated network latency (800ms fetch, 300ms
update).

## Structure

```
src/
  types/task.ts        Task, Filters, TasksState
  api/
    mockApi.ts          fetchTasks/updateTaskStatus (non-mutating demo) +
                         createTask/updateTask/deleteTask (mutate a real
                         in-memory store), all AbortController-aware
    data/
      mockData.json     the 5-task fixture
      mockData_1k.json  1,000-row fixture, dynamically imported only when
                         the large-dataset dev flag is on
  hooks/
    useTasks.ts         cache + abort + optimistic update/rollback + CRUD
    useDebouncedValue.ts
  context/
    FilterContext.tsx       useReducer + useFilters() (throws outside provider)
    TaskActionsContext.tsx  wraps useTasks(); split into useTaskData()
                            (state/refetch/setStatus, for Dashboard) and
                            useTaskActions() (openCreate/openEdit, for
                            Header/TaskCard) so memo isn't broken — see
                            doc/NOTES.md. Also owns the modal/confirm/snackbar
                            UI state and renders them.
  utils/
    filterTasks.ts      pure filter predicate (unit tested)
    sortTasks.ts        pure sort by createdAt
    urlState.ts         read/write filters+sort to the URL query string
  components/
    Dashboard.tsx, Header.tsx, TaskFilters.tsx, TaskList.tsx, TaskCard.tsx,
    TaskStats.tsx, DonutChart.tsx, VirtualList.tsx, ErrorBoundary.tsx
    Modal.tsx, TaskModal.tsx, ConfirmDialog.tsx, Snackbar.tsx
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

A virtualized list scrolls and looks identical to a fully-rendered one — that's
the point — so with `?syntheticTasks=1` active, `VirtualList` also shows a
"Rendering N of M (virtualized)" badge above the list whenever windowing is
doing real work, as visible proof without needing DevTools. It disappears
automatically once the list is short enough that windowing isn't needed.

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
- **URL query params for persistence**, not `localStorage`/a router. Filters
  and sort are small, already-serializable state that's natural to put in the
  URL (shareable, back/forward-friendly); `history.replaceState` avoids
  pulling in a router for one read-on-mount + write-on-change sync.
- **Two contexts, not one, for `TaskActionsContext`.** `Header` and `TaskCard`
  only need stable `openCreate`/`openEdit` triggers; `Dashboard` needs the
  live `state`. Combining them into one context value would make every card
  re-render on any task mutation (the value's reference changes whenever
  `state` does) regardless of `React.memo` — splitting keeps the
  action-trigger context's value permanently stable.
- **create/update/delete are awaited, not optimistic.** Unlike the inline
  status `<select>` (always visible, needs to feel instant, so it applies
  immediately and rolls back on failure), the modal flows already show a
  pending state via a disabled Save/Delete button, and the mock never
  rejects them — so the extra rollback machinery wouldn't buy anything.
- **`updateTaskStatus` stays non-mutating; the new `createTask`/`updateTask`/
  `deleteTask` mutate a real in-memory store.** They're different contracts
  for different purposes: the former is the original demo (rollback on a
  forced failure, tested as never touching the source data); the latter are
  real CRUD that's expected to persist for the session, including surviving
  a `refetch`.
- **`TaskModal`/`ConfirmDialog`/`Snackbar` are `React.lazy`-split**, same
  pattern as `TaskStats`. They're only needed after a user opens a
  modal/dialog/toast, so keeping them out of the initial bundle dropped the
  main chunk from 222 kB to 216 kB (68.9 kB → 67.9 kB gzip) — confirmed via
  `npm run build` emitting each as its own chunk.
- **`TaskCard` caps its own height (`max-h-[132px] overflow-hidden`) and
  clamps the description to 2 lines (`line-clamp-2`).** `VirtualList`
  absolutely-positions each row at a fixed `ROW_HEIGHT` (140px); a long,
  unclamped description could grow taller than that and visually overlap
  the next row. The `max-h` is a hard backstop (can never exceed the row),
  the `line-clamp` keeps that backstop from having to clip anything in the
  common case.

Full trade-off log, including ambiguous-requirement calls made during the
build, is in [`doc/NOTES.md`](doc/NOTES.md). AI usage disclosure (per the
assessment rules) is in [`doc/AI_Usage.md`](doc/AI_Usage.md).

## Testing

Targeted, not exhaustive — per the assessment's "one meaningful test"
minimum, exceeded with 70 tests across 11 files, covering the logic most
likely to regress (including several real bugs the test-writing itself
caught, see `doc/NOTES.md`):

- `filterTasks.test.ts` — status, priority, assignee, and combined filtering.
- `sortTasks.test.ts` — newest/oldest ordering, non-mutation, empty input.
- `devFlags.test.ts` — every flag's default-off state and URL-param wiring.
- `useDebouncedValue.test.ts` — delayed update, cancel-on-rapid-change, and a
  custom delay.
- `useTasks.test.tsx` — loading→success and loading→error transitions;
  optimistic update with rollback on a mocked rejection; `refetch`; and that
  a second mount is served from cache instead of refetching.
- `FilterContext.test.tsx` — toggle/clear behavior, and that `setAssignee`
  with an unchanged value returns the same `filters` reference (the fix for
  the re-render loop noted in `doc/NOTES.md`).
- `mockApi.test.ts` — the fetch/update timing and dataset-pool selection that
  `useTasks.test.tsx` mocks away; the large-dataset and failure-injector
  branches; the abort path; and that the source dataset is never mutated.
- `ErrorBoundary.test.tsx` — renders children normally, shows the fallback
  on a render error, and recovers via reset once the underlying child stops
  throwing.
- `VirtualList.test.tsx` — only the rows in the scrolled viewport (+
  overscan) are rendered, the window shifts correctly on scroll, and the
  "virtualized" badge only appears once windowing is actually doing work.
- `TaskFilters.test.tsx` — facet counts, assignee list, checkbox/radio
  toggling, "Clear all", and the debounced search narrowing the assignee
  list.
- `urlState.test.ts` — parsing/serializing filters and sort to/from the query
  string, dropping invalid values, round-tripping, omitting params at their
  default, and preserving unrelated existing params.
- `mockApi.test.ts` (extended) — `createTask`/`updateTask`/`deleteTask`:
  generated id/timestamp, partial updates persisting across a later
  `fetchTasks`, removal, and rejecting on an unknown id.
- `useTasks.test.tsx` (extended) — the three new methods applying their
  result to local state once the (mocked) API call resolves.

Still untested: `Dashboard`'s composed rendering (filter+sort+list wiring),
`TaskStats`/`DonutChart`'s derived output, `TaskCard`'s own render (including
the `max-h`/`line-clamp` overflow fix — currently verified only by a one-off
manual Playwright screenshot, not a regression test), and the new
`TaskModal`/`ConfirmDialog`/`Snackbar`/`TaskActionsContext` — the full
create/edit/delete flow is currently verified only by the manual Playwright
smoke script (see `doc/NOTES.md`), not by component tests.

## Assumptions

- The assignee filter is a single-select (radio: `All` + each name), with a
  debounced search box that narrows the radio list rather than filtering
  tasks directly by free text — matching the supplied mockup while still
  satisfying the brief's "single-select or search" requirement.
- Sorting (`Created: Newest`/`Created: Oldest`) is local `Dashboard` state,
  not part of `FilterContext` — it's applied after filtering and doesn't need
  to be shared across components, just synced to the URL independently (see
  `urlState.ts`) for reload/share persistence.
- The header is title-only and the per-card "..." menu/user-avatar control
  from the mockup were removed at explicit request — no menu actions or auth
  were ever in scope, so this drops unused decorative surface rather than
  cutting a requirement.

## Trade-offs / what's next

Built to the PRP's phase-gated scope, so depth was favoured over breadth.
Deferred:

- Variable-height virtualization (only fixed-height rows are implemented;
  see the comment in `VirtualList.tsx`).
- A real backend — `mockApi.ts` is an in-memory fixture for the session only.
