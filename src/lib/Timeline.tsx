import { type Component, For, createSignal, createMemo, onCleanup } from "solid-js";
import type {
  DeletedRange,
  Item,
  RowItemSlice,
  TimelineProps,
} from "./types.ts";
import { DEFAULT_PIXELS_PER_SECOND } from "./constants.ts";
import { computeRows, assignItemsToRows, packItemsInRow } from "./layout.ts";
import { pixelToTime } from "./time-utils.ts";
import { TimelineRow } from "./TimelineRow.tsx";

export const Timeline: Component<TimelineProps> = (props) => {
  const pps = () => props.pixelsPerSecond ?? DEFAULT_PIXELS_PER_SECOND;

  const totalDuration = () =>
    props.data.mainTrackConf.item.endTime - props.data.mainTrackConf.item.startTime;

  const [containerWidth, setContainerWidth] = createSignal(800);

  const setupResizeObserver = (el: HTMLDivElement) => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  };

  const rows = createMemo(() =>
    computeRows(totalDuration(), containerWidth(), pps()),
  );

  const mainTrackItem = () => props.data.mainTrackConf.item;

  const itemsByRow = createMemo(() =>
    assignItemsToRows(props.data.items, rows()),
  );

  const mainSlicesByRow = createMemo(() => {
    const mainItem = mainTrackItem();
    const fakeItems: Item[] = [mainItem as Item];
    return assignItemsToRows(fakeItems, rows());
  });

  const layersByRow = createMemo(() => {
    const result = new Map<number, RowItemSlice[][]>();
    for (const row of rows()) {
      const slices = itemsByRow().get(row.rowIndex) ?? [];
      result.set(row.rowIndex, packItemsInRow(slices));
    }
    return result;
  });

  // Drag state
  const [dragItem, setDragItem] = createSignal<Item | null>(null);
  const [dragStartX, setDragStartX] = createSignal(0);
  const [dragOrigStart, setDragOrigStart] = createSignal(0);

  const handleItemDragStart = (e: MouseEvent, item: Item) => {
    e.preventDefault();
    setDragItem(item);
    setDragStartX(e.clientX);
    setDragOrigStart(item.startTime);

    const onMove = (me: MouseEvent) => {
      const di = dragItem();
      if (!di) return;
      const dx = me.clientX - dragStartX();
      const dt = dx / pps();
      const duration = di.endTime - di.startTime;
      let newStart = dragOrigStart() + dt;
      newStart = Math.max(0, Math.min(newStart, totalDuration() - duration));
      const newItems = props.data.items.map((it) =>
        it === di
          ? { ...it, startTime: newStart, endTime: newStart + duration }
          : it,
      );
      props.onChange?.({ ...props.data, items: newItems as Item[] });
    };

    const onUp = () => {
      setDragItem(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Range select state for creating deleted ranges
  const [rangeStart, setRangeStart] = createSignal(0);
  const [rangeEnd, setRangeEnd] = createSignal(0);

  const handleRangeSelectStart = (e: MouseEvent, rowStartTime: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const time = pixelToTime(px, rowStartTime, pps());

    setRangeStart(time);
    setRangeEnd(time);

    const onMove = (me: MouseEvent) => {
      const movePx = me.clientX - rect.left;
      const moveTime = pixelToTime(movePx, rowStartTime, pps());
      setRangeEnd(Math.max(0, Math.min(moveTime, totalDuration())));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      const s = Math.min(rangeStart(), rangeEnd());
      const end = Math.max(rangeStart(), rangeEnd());
      if (end - s < 0.1) return;

      const newRange: DeletedRange = { start: s, end };
      const existing = props.data.deletedRanges ?? [];
      props.onChange?.({
        ...props.data,
        deletedRanges: [...existing, newRange],
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleRemoveDeletedRange = (range: DeletedRange) => {
    const existing = props.data.deletedRanges ?? [];
    props.onChange?.({
      ...props.data,
      deletedRanges: existing.filter((r) => r !== range),
    });
  };

  return (
    <div ref={setupResizeObserver} class="w-full">
      <For each={rows()}>
        {(row) => {
          const mainSlices = () => mainSlicesByRow().get(row.rowIndex) ?? [];
          const mainSlice = () => mainSlices()[0];
          const overlayLayers = () =>
            layersByRow().get(row.rowIndex) ?? [];

          return (
            <div class="border-b border-gray-200">
              <TimelineRow
                row={row}
                mainTrackSlice={mainSlice()}
                layers={overlayLayers()}
                asrData={props.data.mainTrackConf.asrData}
                deletedRanges={props.data.deletedRanges ?? []}
                pixelsPerSecond={pps()}
                onItemDragStart={handleItemDragStart}
                onRemoveDeletedRange={handleRemoveDeletedRange}
                onRangeSelectStart={handleRangeSelectStart}
              />
            </div>
          );
        }}
      </For>
    </div>
  );
};
