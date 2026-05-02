import { type Component, For } from "solid-js";
import type { AsrData } from "./types.ts";
import { ASR_TRACK_HEIGHT } from "./constants.ts";
import { timeToPixel } from "./time-utils.ts";

export interface AsrTrackProps {
  asrData: AsrData;
  rowStartTime: number;
  rowEndTime: number;
  pixelsPerSecond: number;
}

export const AsrTrack: Component<AsrTrackProps> = (props) => {
  const visibleWords = () => {
    const words: { word: string; left: number }[] = [];
    for (const seg of props.asrData.segments) {
      for (const w of seg.words) {
        if (w.end <= props.rowStartTime || w.start >= props.rowEndTime) continue;
        words.push({
          word: w.word,
          left: timeToPixel(
            Math.max(w.start, props.rowStartTime),
            props.rowStartTime,
            props.pixelsPerSecond,
          ),
        });
      }
    }
    return words;
  };

  return (
    <div class="relative" style={{ height: `${ASR_TRACK_HEIGHT}px` }}>
      <For each={visibleWords()}>
        {(w) => (
          <span
            class="absolute text-sm font-medium text-black whitespace-nowrap"
            style={{
              left: `${w.left}px`,
              top: "0",
              "line-height": `${ASR_TRACK_HEIGHT}px`,
            }}
          >
            {w.word}
          </span>
        )}
      </For>
    </div>
  );
};
