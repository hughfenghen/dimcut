import { type Component, createEffect, createSignal, on, onCleanup } from "solid-js";
import { ITEM_COLORS, ROW_ITEM_HEIGHT } from "./constants.ts";
import { WaveformCanvas } from "./WaveformCanvas.tsx";
import type { WaveformExtractor } from "./waveform-extractor.ts";
import type { Item } from "./types.ts";

export interface AudioTrackItemProps {
  extractor: WaveformExtractor;
  visibleStart: number;
  visibleEnd: number;
  rowStartTime: number;
  pixelsPerSecond: number;
  left: number;
  width: number;
  item?: Item;
  onDragStart?: (e: MouseEvent, item: Item) => void;
}

export const AudioTrackItem: Component<AudioTrackItemProps> = (props) => {
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  const [isVisible, setIsVisible] = createSignal(false);
  const [waveformData, setWaveformData] = createSignal<Float32Array>(new Float32Array(0));
  let hasDrawn = false;
  let lastDrawnPps = 0;

  let lastDrawnFileStart = 0;
  let lastDrawnFileEnd = 0;

  const loadWaveform = () => {
    const pps = props.pixelsPerSecond;
    const itemStart = props.item?.startTime ?? 0;
    const fileStart = props.visibleStart - itemStart;
    const fileEnd = props.visibleEnd - itemStart;
    const data = props.extractor.extract(fileStart, fileEnd, pps);
    setWaveformData(data);
    hasDrawn = true;
    lastDrawnPps = pps;
    lastDrawnFileStart = fileStart;
    lastDrawnFileEnd = fileEnd;
  };

  const throttledLoad = () => {
    if (throttleTimer) clearTimeout(throttleTimer);
    throttleTimer = setTimeout(() => {
      loadWaveform();
    }, 300);
  };

  const setupObserver = (el: HTMLDivElement) => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { rootMargin: "100px 0px" },
    );
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  };

  createEffect(
    on(
      [() => props.pixelsPerSecond, () => props.visibleStart, () => props.visibleEnd, () => props.item?.startTime, isVisible],
      () => {
        if (!isVisible()) return;
        const itemStart = props.item?.startTime ?? 0;
        const fileStart = props.visibleStart - itemStart;
        const fileEnd = props.visibleEnd - itemStart;
        const fsChanged = fileStart !== lastDrawnFileStart || fileEnd !== lastDrawnFileEnd;
        if (!hasDrawn || props.pixelsPerSecond !== lastDrawnPps || fsChanged) {
          throttledLoad();
        }
      },
    ),
  );

  onCleanup(() => {
    if (throttleTimer) clearTimeout(throttleTimer);
  });

  const canvasWidth = () =>
    Math.ceil((props.visibleEnd - props.visibleStart) * props.pixelsPerSecond);

  const handleMouseDown = (e: MouseEvent) => {
    if (props.item && props.onDragStart) {
      props.onDragStart(e, props.item);
    }
  };

  return (
    <div
      ref={setupObserver}
      class="absolute rounded-sm overflow-hidden select-none"
      style={{
        left: `${props.left}px`,
        width: `${props.width}px`,
        height: `${ROW_ITEM_HEIGHT}px`,
        "background-color": ITEM_COLORS.audio,
        cursor: props.onDragStart ? "grab" : "default",
      }}
      onMouseDown={handleMouseDown}
    >
      <WaveformCanvas
        waveformData={waveformData()}
        width={canvasWidth()}
        height={ROW_ITEM_HEIGHT}
      />
    </div>
  );
};
