import { useRef, useState, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
}

// Fixed-row-height windowing: only the rows inside the scrolled viewport
// (plus a small overscan buffer) are mounted, so cost stays O(visible rows)
// regardless of total list length.
//
// 10,000+ row strategy for VARIABLE-height rows (not implemented here,
// since this dataset's cards are uniform height): fixed-height windowing
// breaks because you can't compute an item's scroll offset from its index
// alone. The standard fix is to keep a measured-height cache (e.g. a Map of
// index -> last measured height, seeded with an estimate), derive a
// cumulative offset array/prefix-sum from it to binary-search "which items
// are in the current scroll range", and re-measure with a ResizeObserver as
// rows mount, patching the cache and offset array incrementally. Libraries
// like react-virtual/react-window implement exactly this; doing it by hand
// is out of scope for a fixed-height list of mock tasks.
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

  return (
    <div
      ref={containerRef}
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
  );
}
