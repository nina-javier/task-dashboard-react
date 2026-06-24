import { describe, expect, it } from "vitest";
import {
  readFiltersFromUrl,
  readSortFromUrl,
  writeFiltersToUrl,
  writeSortToUrl,
} from "./urlState";

describe("readFiltersFromUrl", () => {
  it("defaults to no constraints when there's no query string", () => {
    expect(readFiltersFromUrl("")).toEqual({ status: [], priority: [], assignee: null });
  });

  it("parses comma-separated status and priority lists", () => {
    expect(readFiltersFromUrl("?status=todo,done&priority=high")).toEqual({
      status: ["todo", "done"],
      priority: ["high"],
      assignee: null,
    });
  });

  it("parses assignee", () => {
    expect(readFiltersFromUrl("?assignee=Bob").assignee).toBe("Bob");
  });

  it("drops unknown/invalid status and priority values", () => {
    expect(readFiltersFromUrl("?status=todo,bogus&priority=nope")).toEqual({
      status: ["todo"],
      priority: [],
      assignee: null,
    });
  });
});

describe("writeFiltersToUrl", () => {
  it("sets status/priority/assignee params and omits empty ones", () => {
    writeFiltersToUrl({ status: ["todo", "done"], priority: ["high"], assignee: "Alice" });
    expect(window.location.search).toBe("?status=todo%2Cdone&priority=high&assignee=Alice");
  });

  it("clears all params when filters are empty", () => {
    writeFiltersToUrl({ status: ["todo"], priority: [], assignee: "Bob" });
    writeFiltersToUrl({ status: [], priority: [], assignee: null });
    expect(window.location.search).toBe("");
  });

  it("round-trips through readFiltersFromUrl", () => {
    const filters = { status: ["in-progress" as const], priority: ["low" as const, "high" as const], assignee: "Charlie" };
    writeFiltersToUrl(filters);
    expect(readFiltersFromUrl()).toEqual(filters);
  });

  it("preserves an unrelated existing query param", () => {
    window.history.replaceState(null, "", "/?sort=oldest");
    writeFiltersToUrl({ status: ["todo"], priority: [], assignee: null });
    const params = new URLSearchParams(window.location.search);
    expect(params.get("sort")).toBe("oldest");
    expect(params.get("status")).toBe("todo");
  });
});

describe("readSortFromUrl / writeSortToUrl", () => {
  it("defaults to newest", () => {
    expect(readSortFromUrl("")).toBe("newest");
  });

  it("reads oldest explicitly", () => {
    expect(readSortFromUrl("?sort=oldest")).toBe("oldest");
  });

  it("omits the param for the default (newest) and sets it for oldest", () => {
    writeSortToUrl("oldest");
    expect(window.location.search).toBe("?sort=oldest");

    writeSortToUrl("newest");
    expect(window.location.search).toBe("");
  });
});
