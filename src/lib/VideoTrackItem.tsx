import { type Component, createEffect, createSignal, on, onCleanup, Show } from "solid-js";
import { ITEM_COLORS, MAIN_TRACK_HEIGHT } from "./constants.ts";
import {
  computeThumbnailParams,
  type ThumbnailExtractor,
} from "./thumbnail-extractor.ts";
import { WaveformCanvas } from "./WaveformCanvas.tsx";
import type { WaveformExtractor } from "./waveform-extractor.ts";

const WAVEFORM_HEIGHT = 20;

export interface VideoTrackItemProps {
  extractor: ThumbnailExtractor;
  visibleStart: number;
  visibleEnd: number;
  rowStartTime: number;
  pixelsPerSecond: number;
  left: number;
  width: number;
  waveformExtractor?: WaveformExtractor;
}

export const VideoTrackItem: Component<VideoTrackItemProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  const [isVisible, setIsVisible] = createSignal(false);
  const [waveformData, setWaveformData] = createSignal<Float32Array>(new Float32Array(0));
  let hasDrawn = false;
  let lastDrawnPps = 0;

  const hasWaveform = () =>
    props.waveformExtractor != null && props.waveformExtractor.hasAudioTrack();

  const totalHeight = () =>
    hasWaveform() ? MAIN_TRACK_HEIGHT + WAVEFORM_HEIGHT : MAIN_TRACK_HEIGHT;

  const drawThumbnails = async () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const videoInfo = props.extractor.getVideoInfo();
    if (!videoInfo) return;

    const pps = props.pixelsPerSecond;
    const width = Math.ceil(
      (props.visibleEnd - props.visibleStart) * pps,
    );
    const height = MAIN_TRACK_HEIGHT;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fill background as placeholder
    ctx.fillStyle = ITEM_COLORS.video;
    ctx.fillRect(0, 0, width, height);

    const { thumbnailWidth, step } = computeThumbnailParams(
      pps,
      videoInfo.width,
      videoInfo.height,
      videoInfo.duration,
    );

    // Align startTime to step grid
    const alignedStart = Math.floor(props.visibleStart / step) * step;

    // Load waveform data synchronously (no decoding, just downsample)
    if (props.waveformExtractor?.hasAudioTrack()) {
      const data = props.waveformExtractor.extract(
        props.visibleStart,
        props.visibleEnd,
        pps,
      );
      setWaveformData(data);
    }

    for await (const { time, canvas: thumbCanvas } of props.extractor.extract(
      alignedStart,
      props.visibleEnd,
      step,
    )) {
      const x = (time - props.visibleStart) * pps;
      ctx.drawImage(thumbCanvas as CanvasImageSource, x, 0, thumbnailWidth, height);
    }

    hasDrawn = true;
    lastDrawnPps = pps;
  };

  const throttledDraw = () => {
    if (throttleTimer) clearTimeout(throttleTimer);
    throttleTimer = setTimeout(() => {
      drawThumbnails();
    }, 300);
  };

  // Lazy load: only extract thumbnails when visible in viewport
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

  // Only trigger redraw on pps change (not visibleStart/visibleEnd or deleteRanges)
  createEffect(
    on(
      [() => props.pixelsPerSecond, isVisible],
      () => {
        if (!isVisible()) return;
        // Only redraw if pps changed or never drawn
        if (!hasDrawn || props.pixelsPerSecond !== lastDrawnPps) {
          throttledDraw();
        }
      },
    ),
  );

  // Load waveform when extractor becomes available after init
  createEffect(
    on(
      () => props.waveformExtractor,
      (ext) => {
        if (!ext?.hasAudioTrack() || !isVisible()) return;
        const pps = props.pixelsPerSecond;
        const data = ext.extract(props.visibleStart, props.visibleEnd, pps);
        setWaveformData(data);
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
        height: `${totalHeight()}px`,
        "background-color": ITEM_COLORS.video,
      }}
    >
      <div style={{ height: `${MAIN_TRACK_HEIGHT}px` }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
      <Show when={hasWaveform()}>
        <div style={{ height: `${WAVEFORM_HEIGHT}px` }}>
          <WaveformCanvas
            waveformData={waveformData()}
            width={canvasWidth()}
            height={WAVEFORM_HEIGHT}
          />
        </div>
      </Show>
    </div>
  );
};
