import { afterEach, describe, expect, it } from "vitest";
import {
  isFailureInjectorEnabled,
  isLargeDatasetEnabled,
  isRenderCounterEnabled,
  isRenderErrorEnabled,
} from "./devFlags";

function setSearch(search: string) {
  window.history.pushState({}, "", search);
}

afterEach(() => {
  setSearch("/");
});

describe("devFlags", () => {
  it("are all disabled by default", () => {
    expect(isFailureInjectorEnabled()).toBe(false);
    expect(isRenderErrorEnabled()).toBe(false);
    expect(isRenderCounterEnabled()).toBe(false);
    expect(isLargeDatasetEnabled()).toBe(false);
  });

  it("isFailureInjectorEnabled responds to ?failTasks=1", () => {
    setSearch("/?failTasks=1");
    expect(isFailureInjectorEnabled()).toBe(true);
  });

  it("isRenderErrorEnabled responds to ?throwRender=1", () => {
    setSearch("/?throwRender=1");
    expect(isRenderErrorEnabled()).toBe(true);
  });

  it("isRenderCounterEnabled responds to ?renderCounter=1", () => {
    setSearch("/?renderCounter=1");
    expect(isRenderCounterEnabled()).toBe(true);
  });

  it("isLargeDatasetEnabled responds to ?syntheticTasks=1", () => {
    setSearch("/?syntheticTasks=1");
    expect(isLargeDatasetEnabled()).toBe(true);
  });

  it("treats any value other than the literal '1' as disabled", () => {
    setSearch("/?failTasks=true&throwRender=yes&syntheticTasks=0");
    expect(isFailureInjectorEnabled()).toBe(false);
    expect(isRenderErrorEnabled()).toBe(false);
    expect(isLargeDatasetEnabled()).toBe(false);
  });

  it("flags are independent of one another", () => {
    setSearch("/?failTasks=1&renderCounter=1");
    expect(isFailureInjectorEnabled()).toBe(true);
    expect(isRenderCounterEnabled()).toBe(true);
    expect(isRenderErrorEnabled()).toBe(false);
    expect(isLargeDatasetEnabled()).toBe(false);
  });
});
