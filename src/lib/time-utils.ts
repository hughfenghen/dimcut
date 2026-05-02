export function timeToPixel(
  time: number,
  rowStartTime: number,
  pixelsPerSecond: number,
): number {
  return (time - rowStartTime) * pixelsPerSecond;
}

export function pixelToTime(
  px: number,
  rowStartTime: number,
  pixelsPerSecond: number,
): number {
  return px / pixelsPerSecond + rowStartTime;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
