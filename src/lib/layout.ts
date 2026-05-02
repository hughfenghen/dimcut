import type { Item, RowLayout, RowItemSlice } from "./types.ts";
import { TIME_LABEL_WIDTH } from "./constants.ts";

export function computeRows(
  totalDuration: number,
  containerWidth: number,
  pixelsPerSecond: number,
  timeLabelWidth: number = TIME_LABEL_WIDTH,
): RowLayout[] {
  const rowWidth = containerWidth - timeLabelWidth;
  if (rowWidth <= 0 || pixelsPerSecond <= 0 || totalDuration <= 0) return [];

  const secondsPerRow = rowWidth / pixelsPerSecond;
  const rowCount = Math.ceil(totalDuration / secondsPerRow);
  const rows: RowLayout[] = [];

  for (let i = 0; i < rowCount; i++) {
    rows.push({
      rowIndex: i,
      startTime: i * secondsPerRow,
      endTime: Math.min((i + 1) * secondsPerRow, totalDuration),
    });
  }

  return rows;
}

export function assignItemsToRows(
  items: Item[],
  rows: RowLayout[],
): Map<number, RowItemSlice[]> {
  const result = new Map<number, RowItemSlice[]>();
  for (const row of rows) {
    result.set(row.rowIndex, []);
  }

  for (const item of items) {
    for (const row of rows) {
      if (item.endTime <= row.startTime || item.startTime >= row.endTime) {
        continue;
      }
      const slices = result.get(row.rowIndex)!;
      slices.push({
        item,
        visibleStart: Math.max(item.startTime, row.startTime),
        visibleEnd: Math.min(item.endTime, row.endTime),
        subRow: 0,
      });
    }
  }

  return result;
}

export function packItemsInRow(slices: RowItemSlice[]): RowItemSlice[][] {
  const groups = new Map<number, RowItemSlice[]>();

  for (const slice of slices) {
    const z = slice.item.zIndex;
    if (!groups.has(z)) groups.set(z, []);
    groups.get(z)!.push(slice);
  }

  const sortedKeys = [...groups.keys()].sort((a, b) => a - b);
  const layers: RowItemSlice[][] = [];

  for (const z of sortedKeys) {
    const groupSlices = groups.get(z)!;
    groupSlices.sort((a, b) => a.visibleStart - b.visibleStart);

    const subRows: RowItemSlice[][] = [];
    for (const slice of groupSlices) {
      let placed = false;
      for (let r = 0; r < subRows.length; r++) {
        const lastInRow = subRows[r][subRows[r].length - 1];
        if (lastInRow.visibleEnd <= slice.visibleStart) {
          slice.subRow = r;
          subRows[r].push(slice);
          placed = true;
          break;
        }
      }
      if (!placed) {
        slice.subRow = subRows.length;
        subRows.push([slice]);
      }
    }

    layers.push(subRows.flat());
  }

  return layers;
}
