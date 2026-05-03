import { type Component, createEffect, createSignal, on, onCleanup } from "solid-js";
import { ITEM_COLORS, ROW_ITEM_HEIGHT } from "./constants.ts";
import { WaveformCanvas } from "./WaveformCanvas.tsx";
import type { WaveformExtractor } from "./waveform-extractor.ts";

export interface AudioTrackItemProps {
  extractor: WaveformExtractor;
  visibleStart: number;
  visibleEnd: number;
  rowStartTime: number;
  pixelsPerSecond: number;
  left: number;
  width: number;
}

export const AudioTrackItem: Component<AudioTrackItemProps> = (props) => {
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  const [isVisible, setIsVisible] = createSignal(false);
  const [waveformData, setWaveformData] = createSignal<Float32Array>(new Float32Array(0));
  let hasDrawn = false;
  let lastDrawnPps = 0;

  const loadWaveform = async () => {
    const pps = props.pixelsPerSecond;
    const data = await props.extractor.extract(
      props.visibleStart,
      props.visibleEnd,
      pps,
    );
    setWaveformData(data);
    hasDrawn = true;
    lastDrawnPps = pps;
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
      [() => props.pixelsPerSecond, isVisible],
      () => {
        if (!isVisible()) return;
        if (!hasDrawn || props.pixelsPerSecond !== lastDrawnPps) {
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

  return (
    <div
      ref={setupObserver}
      class="absolute rounded-sm overflow-hidden select-none"
      style={{
        left: `${props.left}px`,
        width: `${props.width}px`,
        height: `${ROW_ITEM_HEIGHT}px`,
        "background-color": ITEM_COLORS.audio,
      }}
    >
      <WaveformCanvas
        waveformData={waveformData()}
        width={canvasWidth()}
        height={ROW_ITEM_HEIGHT}
      />
    </div>
  );
};
