// Single place for the dev-only demo toggles requested by the PRP: a failure
// injector (prove optimistic-update rollback), a render-error flag (prove the
// ErrorBoundary catches render errors), a render counter (prove React.memo
// holds), and a large-dataset toggle (prove VirtualList windows real rows).
// All are read from the URL query string so they're toggleable without a
// rebuild and never affect production behavior unless explicitly set.

function getParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export function isFailureInjectorEnabled(): boolean {
  return getParam("failTasks") === "1";
}

export function isRenderErrorEnabled(): boolean {
  return getParam("throwRender") === "1";
}

export function isRenderCounterEnabled(): boolean {
  return getParam("renderCounter") === "1";
}

export function isLargeDatasetEnabled(): boolean {
  return getParam("syntheticTasks") === "1";
}
