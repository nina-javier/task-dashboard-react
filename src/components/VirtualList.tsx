import { useRef, useState, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
}

// Fixed-row-height windowing: only rows in the scrolled viewport (+ overscan)
// are mounted, so cost stays O(visible rows) regardless of list length.
// 10,000+ VARIABLE-height rows would instead need a measured-height cache,
// a binary-searched cumulative-offset array, and a ResizeObserver to patch
// both as rows mount — out of scope here since these cards are uniform.
export default function VirtualList<T>({
  items,
  rowHeight,
  height,
  overscan = 3,
  renderItem,
  getKey,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(height / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);
  const visibleItems = items.slice(startIndex, endIndex);

  // Only shown when windowing is actually doing work (more items exist than
  // fit on screen) — visible proof that the DOM node count stays bounded
  // instead of growing with the dataset, without needing to open DevTools.
  const isWindowing = items.length > visibleItems.length;

  return (
    <div>
      {isWindowing && (
        <div className="mb-2 flex justify-end">
          <span className="rounded-md bg-gray-900/80 px-2 py-1 text-xs font-medium text-white">
            Rendering {visibleItems.length} of {items.length} (virtualized)
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        data-testid="virtual-list-viewport"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        style={{ height, overflowY: "auto", position: "relative" }}
      >
        <div style={{ height: items.length * rowHeight, position: "relative" }}>
          {visibleItems.map((item, i) => {
            const index = startIndex + i;
            return (
              <div
                key={getKey(item, index)}
                style={{
                  position: "absolute",
                  top: index * rowHeight,
                  left: 0,
                  right: 0,
                  height: rowHeight,
                }}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
