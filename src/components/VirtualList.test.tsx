import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VirtualList from "./VirtualList";

const items = Array.from({ length: 50 }, (_, i) => `Item ${i}`);

function renderList(overscan: number) {
  return render(
    <VirtualList
      items={items}
      rowHeight={20}
      height={100}
      overscan={overscan}
      getKey={(item) => item}
      renderItem={(item) => <div>{item}</div>}
    />,
  );
}

describe("VirtualList", () => {
  it("renders only the rows within the viewport, not the whole list", () => {
    renderList(0);
    // height 100 / rowHeight 20 = 5 visible rows, overscan 0.
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 4")).toBeInTheDocument();
    expect(screen.queryByText("Item 5")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 49")).not.toBeInTheDocument();
  });

  it("shifts the rendered window when scrolled", () => {
    renderList(0);
    const viewport = screen.getByTestId("virtual-list-viewport");

    fireEvent.scroll(viewport, { target: { scrollTop: 200 } });

    // scrollTop 200 / rowHeight 20 = row 10, so rows 10-14 should be visible.
    expect(screen.getByText("Item 10")).toBeInTheDocument();
    expect(screen.getByText("Item 14")).toBeInTheDocument();
    expect(screen.queryByText("Item 0")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 15")).not.toBeInTheDocument();
  });

  it("includes overscan rows on both sides of the viewport", () => {
    renderList(3);
    // startIndex = max(0, 0 - 3) = 0; endIndex = min(50, 0 + 5 + 6) = 11.
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 10")).toBeInTheDocument();
    expect(screen.queryByText("Item 11")).not.toBeInTheDocument();
  });

  it("shows a virtualization badge with the rendered-vs-total count when windowing", () => {
    renderList(0);
    expect(screen.getByText("Rendering 5 of 50 (virtualized)")).toBeInTheDocument();
  });

  it("hides the virtualization badge when every item already fits", () => {
    render(
      <VirtualList
        items={["a", "b", "c"]}
        rowHeight={20}
        height={100}
        getKey={(item) => item}
        renderItem={(item) => <div>{item}</div>}
      />,
    );
    expect(screen.queryByText(/virtualized/)).not.toBeInTheDocument();
  });
});
