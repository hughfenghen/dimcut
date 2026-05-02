import { type Component, For, Show } from "solid-js";
import type {
  AsrData,
  DeletedRange,
  Item,
  RowItemSlice,
  RowLayout,
} from "./types.ts";
import {
  ASR_TRACK_HEIGHT,
  ROW_ITEM_HEIGHT,
  TIME_LABEL_WIDTH,
} from "./constants.ts";
import { formatTime, timeToPixel } from "./time-utils.ts";
import { TrackItem } from "./TrackItem.tsx";
import { AsrTrack } from "./AsrTrack.tsx";
import { DeletedRangeOverlay } from "./DeletedRange.tsx";

export interface TimelineRowProps {
  row: RowLayout;
  mainTrackSlice: RowItemSlice | undefined;
  layers: RowItemSlice[][];
  asrData?: AsrData;
  deletedRanges: DeletedRange[];
  pixelsPerSecond: number;
  onItemDragStart?: (e: MouseEvent, item: Item) => void;
  onRemoveDeletedRange?: (range: DeletedRange) => void;
  onRangeSelectStart?: (e: MouseEvent, rowStartTime: number) => void;
  selectionRange?: { start: number; end: number };
}

export const TimelineRow: Component<TimelineRowProps> = (props) => {
  const hasAsr = () => !!props.asrData;

  const layerCount = () => {
    let count = 0;
    for (const layer of props.layers) {
      const maxSubRow = layer.reduce((m, s) => Math.max(m, s.subRow), 0);
      count += maxSubRow + 1;
    }
    return count;
  };

  const mainTrackRows = () => (props.mainTrackSlice ? 1 : 0);

  const totalContentHeight = () => {
    const asr = hasAsr() ? ASR_TRACK_HEIGHT : 0;
    const main = mainTrackRows() * ROW_ITEM_HEIGHT;
    const overlays = layerCount() * ROW_ITEM_HEIGHT;
    return asr + main + overlays || ROW_ITEM_HEIGHT;
  };

  const mainTrackTop = () => (hasAsr() ? ASR_TRACK_HEIGHT : 0);

  const overlayBaseTop = () => mainTrackTop() + mainTrackRows() * ROW_ITEM_HEIGHT;

  const visibleDeletedRanges = () =>
    props.deletedRanges.filter(
      (r) => r.end > props.row.startTime && r.start < props.row.endTime,
    );

  // Selection overlay for this row
  const selectionOverlay = () => {
    const sel = props.selectionRange;
    if (!sel) return null;
    if (sel.end <= props.row.startTime || sel.start >= props.row.endTime) return null;
    const visStart = Math.max(sel.start, props.row.startTime);
    const visEnd = Math.min(sel.end, props.row.endTime);
    const left = timeToPixel(visStart, props.row.startTime, props.pixelsPerSecond);
    const width = (visEnd - visStart) * props.pixelsPerSecond;
    return { left, width };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-track-item]") || target.closest("button") || target.closest("[data-selection-menu]")) return;
    props.onRangeSelectStart?.(e, props.row.startTime);
  };

  return (
    <div class="flex" style={{ "min-height": `${totalContentHeight()}px` }}>
      <div
        class="shrink-0 text-xs text-gray-400 pt-1 text-right pr-2"
        style={{ width: `${TIME_LABEL_WIDTH}px` }}
      >
        {formatTime(props.row.startTime)}
      </div>

      <div
        class="relative flex-1"
        style={{ height: `${totalContentHeight()}px` }}
        onMouseDown={handleMouseDown}
        data-row-content
      >
        <Show when={props.asrData}>
          {(asr) => (
            <AsrTrack
              asrData={asr()}
              rowStartTime={props.row.startTime}
              rowEndTime={props.row.endTime}
              pixelsPerSecond={props.pixelsPerSecond}
            />
          )}
        </Show>

        <Show when={props.mainTrackSlice}>
          {(slice) => (
            <div
              class="absolute"
              style={{ top: `${mainTrackTop()}px` }}
              data-track-item
            >
              <TrackItem
                item={slice().item}
                left={timeToPixel(
                  slice().visibleStart,
                  props.row.startTime,
                  props.pixelsPerSecond,
                )}
                width={
                  (slice().visibleEnd - slice().visibleStart) *
                  props.pixelsPerSecond
                }
                isMainTrack
              />
            </div>
          )}
        </Show>

        <For each={props.layers}>
          {(layer, layerIdx) => (
            <For each={layer}>
              {(slice) => {
                let cumulativeTop = overlayBaseTop();
                for (let i = 0; i < layerIdx(); i++) {
                  const prevLayer = props.layers[i];
                  const maxSub = prevLayer.reduce(
                    (m, s) => Math.max(m, s.subRow),
                    0,
                  );
                  cumulativeTop += (maxSub + 1) * ROW_ITEM_HEIGHT;
                }
                const top = cumulativeTop + slice.subRow * ROW_ITEM_HEIGHT;

                return (
                  <div
                    class="absolute"
                    style={{ top: `${top}px` }}
                    data-track-item
                  >
                    <TrackItem
                      item={slice.item}
                      left={timeToPixel(
                        slice.visibleStart,
                        props.row.startTime,
                        props.pixelsPerSecond,
                      )}
                      width={
                        (slice.visibleEnd - slice.visibleStart) *
                        props.pixelsPerSecond
                      }
                      onDragStart={props.onItemDragStart}
                    />
                  </div>
                );
              }}
            </For>
          )}
        </For>

        <For each={visibleDeletedRanges()}>
          {(range) => (
            <DeletedRangeOverlay
              range={range}
              rowStartTime={props.row.startTime}
              rowEndTime={props.row.endTime}
              pixelsPerSecond={props.pixelsPerSecond}
              rowHeight={totalContentHeight()}
              onRemove={props.onRemoveDeletedRange}
            />
          )}
        </For>

        {/* Selection overlay */}
        <Show when={selectionOverlay()}>
          {(overlay) => (
            <div
              class="absolute top-0 z-40 pointer-events-none"
              style={{
                left: `${overlay().left}px`,
                width: `${overlay().width}px`,
                height: `${totalContentHeight()}px`,
                "background-color": "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
              }}
            />
          )}
        </Show>
      </div>
    </div>
  );
};
