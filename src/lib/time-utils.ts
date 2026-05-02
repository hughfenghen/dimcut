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

export function mergeDeletedRanges(
  ranges: Array<{ start: number; end: number }>,
): Array<{ start: number; end: number }> {
  if (ranges.length <= 1) return [...ranges];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const result: Array<{ start: number; end: number }> = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      result.push({ ...sorted[i] });
    }
  }
  return result;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
