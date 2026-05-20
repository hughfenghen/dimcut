import { type Component, For, Index, Show, createSignal } from "solid-js";
import type {
  AsrData,
  DeletedRange,
  Item,
  RowItemSlice,
  RowLayout,
} from "./types.ts";
import {
  ASR_TRACK_HEIGHT,
  MAIN_TRACK_HEIGHT,
  ROW_ITEM_HEIGHT,
  TIME_LABEL_WIDTH,
  TRACK_GAP,
} from "./constants.ts";
import { formatTime, timeToPixel } from "./time-utils.ts";
import { TrackItem } from "./TrackItem.tsx";
import { VideoTrackItem } from "./VideoTrackItem.tsx";
import { AudioTrackItem } from "./AudioTrackItem.tsx";
import { AsrTrack } from "./AsrTrack.tsx";
import { DeletedRangeOverlay } from "./DeletedRange.tsx";
import type { ThumbnailExtractor } from "./thumbnail-extractor.ts";
import type { WaveformExtractor } from "./waveform-extractor.ts";

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
  thumbnailExtractor?: ThumbnailExtractor;
  waveformExtractor?: WaveformExtractor;
  itemWaveformExtractors?: Map<string, WaveformExtractor>;
  currentTime?: number;
  onSeek?: (time: number) => void;
  showAsrTrack?: boolean;
  showMediaTracks?: boolean;
}

export const TimelineRow: Component<TimelineRowProps> = (props) => {
  const hasAsr = () => !!props.asrData && props.showAsrTrack !== false;
  const [asrHeight, setAsrHeight] = createSignal(ASR_TRACK_HEIGHT);

  const asrCurrentTime = () => {
    const t = props.currentTime;
    if (t === undefined) return undefined;
    return t >= props.row.startTime && t < props.row.endTime ? t : undefined;
  };

  const effectiveLayers = () =>
    props.showMediaTracks === false ? [] : props.layers;

  const effectiveMainTrack = () =>
    props.showMediaTracks === false ? undefined : props.mainTrackSlice;

  const layerCount = () => {
    let count = 0;
    for (const layer of effectiveLayers()) {
      const maxSubRow = layer.reduce((m, s) => Math.max(m, s.subRow), 0);
      count += maxSubRow + 1;
    }
    return count;
  };

  const mainTrackRows = () => (effectiveMainTrack() ? 1 : 0);

  const mainTrackHeight = () => {
    const slice = effectiveMainTrack();
    if (!slice) return MAIN_TRACK_HEIGHT;
    if (
      slice.item.type === "video" &&
      props.waveformExtractor?.hasAudioTrack()
    ) {
      return MAIN_TRACK_HEIGHT + 20;
    }
    if (slice.item.type === "audio") {
      return ROW_ITEM_HEIGHT;
    }
    return MAIN_TRACK_HEIGHT;
  };

  const totalContentHeight = () => {
    const asr = hasAsr() ? asrHeight() : 0;
    const main = mainTrackRows() * mainTrackHeight();
    const lc = layerCount();
    const overlays =
      lc > 0 ? lc * (ROW_ITEM_HEIGHT + TRACK_GAP) - TRACK_GAP : 0;
    let gapCount = 0;
    if (asr > 0 && main > 0) gapCount++;
    if (asr > 0 && overlays > 0 && main === 0) gapCount++;
    if (main > 0 && overlays > 0) gapCount++;
    if (asr > 0 && main > 0 && overlays > 0) gapCount = 2;
    const gaps = gapCount * TRACK_GAP;
    return asr + main + overlays + gaps || ROW_ITEM_HEIGHT;
  };

  const mainTrackTop = () => (hasAsr() ? asrHeight() + TRACK_GAP : 0);

  const nonAsrTop = () => mainTrackTop();

  const nonAsrHeight = () => Math.max(0, totalContentHeight() - nonAsrTop());

  const overlayBaseTop = () => {
    let top = mainTrackTop() + mainTrackRows() * mainTrackHeight();
    if (mainTrackRows() > 0) top += TRACK_GAP;
    return top;
  };

  const visibleDeletedRanges = () =>
    props.deletedRanges.filter(
      (r) => r.end > props.row.startTime && r.start < props.row.endTime,
    );

  // Selection overlay for this row
  const selectionOverlay = () => {
    const sel = props.selectionRange;
    if (!sel) return null;
    if (sel.end <= props.row.startTime || sel.start >= props.row.endTime)
      return null;
    const visStart = Math.max(sel.start, props.row.startTime);
    const visEnd = Math.min(sel.end, props.row.endTime);
    const left = timeToPixel(
      visStart,
      props.row.startTime,
      props.pixelsPerSecond,
    );
    const width = (visEnd - visStart) * props.pixelsPerSecond;
    return { left, width };
  };

  const visibleSelectionOverlay = () => {
    if (nonAsrHeight() <= 0) return null;
    return selectionOverlay();
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-track-item]") ||
      target.closest("[data-asr-track]") ||
      target.closest("button") ||
      target.closest("[data-selection-menu]")
    )
      return;
    props.onRangeSelectStart?.(e, props.row.startTime);
  };

  return (
    <div
      class="flex py-2"
      style={{
        "min-height": `${totalContentHeight()}px`,
      }}
    >
      <div
        class="shrink-0 text-xs text-gray-400 text-right pr-2"
        style={{ width: `${TIME_LABEL_WIDTH}px` }}
      >
        {formatTime(props.row.startTime)}
      </div>

      <div
        class="relative flex-1"
        style={{ height: `${totalContentHeight()}px` }}
        onMouseDown={handleMouseDown}
        data-row-content
        data-main-track-top={mainTrackTop()}
      >
        <Show when={props.showAsrTrack && props.asrData}>
          {(asr) => (
            <AsrTrack
              asrData={asr()}
              deletedRanges={props.deletedRanges}
              rowStartTime={props.row.startTime}
              rowEndTime={props.row.endTime}
              onHeightChange={setAsrHeight}
              currentTime={asrCurrentTime()}
              onSeek={props.onSeek}
            />
          )}
        </Show>

        <Show when={effectiveMainTrack()}>
          {(slice) => {
            const left = () =>
              timeToPixel(
                slice().visibleStart,
                props.row.startTime,
                props.pixelsPerSecond,
              );
            const width = () =>
              (slice().visibleEnd - slice().visibleStart) *
              props.pixelsPerSecond;

            return (
              <div class="absolute" style={{ top: `${mainTrackTop()}px` }}>
                {slice().item.type === "video" && props.thumbnailExtractor ? (
                  <VideoTrackItem
                    extractor={props.thumbnailExtractor}
                    visibleStart={slice().visibleStart}
                    visibleEnd={slice().visibleEnd}
                    rowStartTime={props.row.startTime}
                    pixelsPerSecond={props.pixelsPerSecond}
                    left={left()}
                    width={width()}
                    waveformExtractor={props.waveformExtractor}
                  />
                ) : slice().item.type === "audio" && props.waveformExtractor ? (
                  <AudioTrackItem
                    extractor={props.waveformExtractor}
                    visibleStart={slice().visibleStart}
                    visibleEnd={slice().visibleEnd}
                    rowStartTime={props.row.startTime}
                    pixelsPerSecond={props.pixelsPerSecond}
                    left={left()}
                    width={width()}
                  />
                ) : (
                  <TrackItem
                    item={slice().item}
                    left={left()}
                    width={width()}
                    isMainTrack
                  />
                )}
              </div>
            );
          }}
        </Show>

        <Index each={effectiveLayers()}>
          {(layer, layerIdx) => (
            <Index each={layer()}>
              {(slice) => {
                const top = () => {
                  let cumulativeTop = overlayBaseTop();
                  const layers = effectiveLayers();
                  for (let i = 0; i < layerIdx; i++) {
                    const prevLayer = layers[i];
                    const maxSub = prevLayer.reduce(
                      (m, s) => Math.max(m, s.subRow),
                      0,
                    );
                    cumulativeTop +=
                      (maxSub + 1) * (ROW_ITEM_HEIGHT + TRACK_GAP);
                  }
                  return (
                    cumulativeTop +
                    slice().subRow * (ROW_ITEM_HEIGHT + TRACK_GAP)
                  );
                };

                return (
                  <div
                    class="absolute"
                    style={{ top: `${top()}px` }}
                    data-track-item
                  >
                    {slice().item.type === "audio" &&
                    props.itemWaveformExtractors?.get(slice().item.id) ? (
                      <AudioTrackItem
                        extractor={
                          props.itemWaveformExtractors.get(slice().item.id)!
                        }
                        visibleStart={slice().visibleStart}
                        visibleEnd={slice().visibleEnd}
                        rowStartTime={props.row.startTime}
                        pixelsPerSecond={props.pixelsPerSecond}
                        left={timeToPixel(
                          slice().visibleStart,
                          props.row.startTime,
                          props.pixelsPerSecond,
                        )}
                        width={
                          (slice().visibleEnd - slice().visibleStart) *
                          props.pixelsPerSecond
                        }
                        item={slice().item}
                        onDragStart={props.onItemDragStart}
                      />
                    ) : (
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
                        onDragStart={props.onItemDragStart}
                      />
                    )}
                  </div>
                );
              }}
            </Index>
          )}
        </Index>

        <Show when={nonAsrHeight() > 0}>
          <For each={visibleDeletedRanges()}>
            {(range) => (
              <DeletedRangeOverlay
                range={range}
                rowStartTime={props.row.startTime}
                rowEndTime={props.row.endTime}
                pixelsPerSecond={props.pixelsPerSecond}
                topOffset={nonAsrTop()}
                rowHeight={nonAsrHeight()}
                onRemove={props.onRemoveDeletedRange}
              />
            )}
          </For>
        </Show>

        {/* Selection overlay */}
        <Show when={visibleSelectionOverlay()}>
          {(overlay) => (
            <div
              class="absolute z-40 pointer-events-none"
              style={{
                left: `${overlay().left}px`,
                width: `${overlay().width}px`,
                top: `${nonAsrTop()}px`,
                height: `${nonAsrHeight()}px`,
                "background-color": "rgba(59, 130, 246, 0.5)",
                border: "1px solid rgba(59, 130, 246, 0.8)",
              }}
            />
          )}
        </Show>
      </div>
    </div>
  );
};
