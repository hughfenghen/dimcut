import { type Component, createEffect, on } from "solid-js";

export interface WaveformCanvasProps {
  waveformData: Float32Array;
  width: number;
  height: number;
  color?: string;
  barWidth?: number;
  gap?: number;
}

export const WaveformCanvas: Component<WaveformCanvasProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;

  const draw = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = props.width;
    const height = props.height;
    const data = props.waveformData;
    const color = props.color ?? "#FFFFFF";
    const barWidth = props.barWidth ?? 2;
    const gap = props.gap ?? 1;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    ctx.fillStyle = color;

    const step = barWidth + gap;
    const barCount = Math.floor(width / step);

    // Find global max peak for normalization
    let maxPeak = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > maxPeak) maxPeak = data[i];
    }
    if (maxPeak === 0) return;

    const centerY = height / 2;

    for (let i = 0; i < barCount; i++) {
      // Map bar index to data range
      const dataStart = Math.floor((i * data.length) / barCount);
      const dataEnd = Math.floor(((i + 1) * data.length) / barCount);

      // Find peak in range
      let peak = 0;
      for (let j = dataStart; j < dataEnd && j < data.length; j++) {
        if (data[j] > peak) peak = data[j];
      }

      // Normalize to 0~1 relative to max peak, then scale to half height
      const normalized = peak / maxPeak;
      const halfBarHeight = Math.max(0.5, normalized * centerY);
      const x = i * step;

      // Draw mirrored bar centered vertically with rounded corners
      const radius = Math.min(2, barWidth / 2);
      ctx.beginPath();
      ctx.roundRect(x, centerY - halfBarHeight, barWidth, halfBarHeight * 2, radius);
      ctx.fill();
    }
  };

  createEffect(
    on(
      () => [props.waveformData, props.width, props.height],
      () => draw(),
    ),
  );

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};
