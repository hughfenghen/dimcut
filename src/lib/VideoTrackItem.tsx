import { type Component, createEffect, createSignal, on, onCleanup } from "solid-js";
import { ITEM_COLORS, MAIN_TRACK_HEIGHT } from "./constants.ts";
import {
  computeThumbnailParams,
  type ThumbnailExtractor,
} from "./thumbnail-extractor.ts";

export interface VideoTrackItemProps {
  extractor: ThumbnailExtractor;
  visibleStart: number;
  visibleEnd: number;
  rowStartTime: number;
  pixelsPerSecond: number;
  left: number;
  width: number;
}

export const VideoTrackItem: Component<VideoTrackItemProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  const [isVisible, setIsVisible] = createSignal(false);
  let hasDrawn = false;
  let lastDrawnPps = 0;

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

    canvas.width = width;
    canvas.height = height;

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

  onCleanup(() => {
    if (throttleTimer) clearTimeout(throttleTimer);
  });

  return (
    <div
      ref={setupObserver}
      class="absolute rounded-sm overflow-hidden select-none"
      style={{
        left: `${props.left}px`,
        width: `${props.width}px`,
        height: `${MAIN_TRACK_HEIGHT}px`,
        "background-color": ITEM_COLORS.video,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
};
