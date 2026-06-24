// Single place for the dev-only demo toggles requested by the PRP: a failure
// injector, a render-error flag, a render counter, and a large-dataset
// toggle — each proves behavior (rollback, ErrorBoundary, memo, windowing)
// that's otherwise hard to trigger from the UI. All read the URL query
// string, so they're toggleable without a rebuild and inert by default.

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
