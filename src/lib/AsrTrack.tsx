import { type Component, For, createMemo, onCleanup } from "solid-js";
import type { AsrData, DeletedRange } from "./types.ts";
import { ASR_TRACK_HEIGHT } from "./constants.ts";
import { getAsrSegmentsForRow, isAsrWordDeleted } from "./asr-utils.ts";

export interface AsrTrackProps {
  asrData: AsrData;
  deletedRanges: DeletedRange[];
  rowStartTime: number;
  rowEndTime: number;
  onHeightChange?: (height: number) => void;
}

export const AsrTrack: Component<AsrTrackProps> = (props) => {
  let trackRef: HTMLDivElement | undefined;

  const visibleSegments = createMemo(() =>
    getAsrSegmentsForRow(
      props.asrData,
      props.rowStartTime,
      props.rowEndTime,
    ).map((seg) => ({
      ...seg,
      words: seg.words.map((w) => ({
        ...w,
        isDeleted: isAsrWordDeleted(w, props.deletedRanges),
      })),
    })),
  );

  const setupResizeObserver = (el: HTMLDivElement) => {
    trackRef = el;
    props.onHeightChange?.(Math.max(el.offsetHeight, ASR_TRACK_HEIGHT));
    const observer = new ResizeObserver(() => {
      if (!trackRef) return;
      props.onHeightChange?.(Math.max(trackRef.offsetHeight, ASR_TRACK_HEIGHT));
    });
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  };

  return (
    <div
      ref={setupResizeObserver}
      class="relative min-h-6 leading-6 px-1 text-sm text-black whitespace-pre-wrap break-words select-text"
      data-asr-track
      style={{ "min-height": `${ASR_TRACK_HEIGHT}px` }}
    >
      <For each={visibleSegments()}>
        {(seg) => (
          <p>
            <For each={seg.words}>
              {(w) => (
                <span
                  class={
                    w.isDeleted
                      ? "rounded-[2px] bg-red-300/50 line-through px-[1px]"
                      : "px-[1px]"
                  }
                  data-asr-word
                  data-asr-word-start={w.start}
                  data-asr-word-end={w.end}
                >
                  {w.word}
                </span>
              )}
            </For>
          </p>
        )}
      </For>
    </div>
  );
};
