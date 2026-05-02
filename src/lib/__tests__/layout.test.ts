import { describe, it, expect } from "vitest";
import { computeRows, assignItemsToRows, packItemsInRow } from "../layout.ts";
import type { Item, RowItemSlice } from "../types.ts";

describe("computeRows", () => {
  it("returns empty for zero duration", () => {
    expect(computeRows(0, 800, 80)).toEqual([]);
  });

  it("returns empty for zero container width", () => {
    expect(computeRows(30, 0, 80)).toEqual([]);
  });

  it("computes correct number of rows", () => {
    // containerWidth=860, timeLabelWidth=60 → rowWidth=800
    // pps=80 → secondsPerRow = 800/80 = 10
    // totalDuration=30 → 3 rows
    const rows = computeRows(30, 860, 80, 60);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ rowIndex: 0, startTime: 0, endTime: 10 });
    expect(rows[1]).toEqual({ rowIndex: 1, startTime: 10, endTime: 20 });
    expect(rows[2]).toEqual({ rowIndex: 2, startTime: 20, endTime: 30 });
  });

  it("handles duration not evenly divisible", () => {
    const rows = computeRows(25, 860, 80, 60);
    expect(rows).toHaveLength(3);
    expect(rows[2].endTime).toBe(25);
  });
});

describe("assignItemsToRows", () => {
  const rows = computeRows(30, 860, 80, 60);

  it("assigns item to correct row", () => {
    const items: Item[] = [
      { type: "audio", startTime: 2, endTime: 5, zIndex: 1 } as Item,
    ];
    const result = assignItemsToRows(items, rows);
    expect(result.get(0)).toHaveLength(1);
    expect(result.get(1)).toHaveLength(0);
  });

  it("splits item across rows", () => {
    const items: Item[] = [
      { type: "audio", startTime: 8, endTime: 13, zIndex: 1 } as Item,
    ];
    const result = assignItemsToRows(items, rows);
    const row0 = result.get(0)!;
    const row1 = result.get(1)!;
    expect(row0).toHaveLength(1);
    expect(row0[0].visibleStart).toBe(8);
    expect(row0[0].visibleEnd).toBe(10);
    expect(row1).toHaveLength(1);
    expect(row1[0].visibleStart).toBe(10);
    expect(row1[0].visibleEnd).toBe(13);
  });

  it("does not assign item outside its time range", () => {
    const items: Item[] = [
      { type: "image", startTime: 22, endTime: 25, zIndex: 2 } as Item,
    ];
    const result = assignItemsToRows(items, rows);
    expect(result.get(0)).toHaveLength(0);
    expect(result.get(1)).toHaveLength(0);
    expect(result.get(2)).toHaveLength(1);
  });
});

describe("packItemsInRow", () => {
  it("groups by zIndex", () => {
    const slices: RowItemSlice[] = [
      { item: { type: "audio", startTime: 0, endTime: 3, zIndex: 1 } as Item, visibleStart: 0, visibleEnd: 3, subRow: 0 },
      { item: { type: "image", startTime: 4, endTime: 7, zIndex: 2 } as Item, visibleStart: 4, visibleEnd: 7, subRow: 0 },
    ];
    const layers = packItemsInRow(slices);
    expect(layers).toHaveLength(2);
  });

  it("packs non-overlapping items in same subRow", () => {
    const slices: RowItemSlice[] = [
      { item: { type: "audio", startTime: 0, endTime: 3, zIndex: 1 } as Item, visibleStart: 0, visibleEnd: 3, subRow: 0 },
      { item: { type: "audio", startTime: 5, endTime: 8, zIndex: 1 } as Item, visibleStart: 5, visibleEnd: 8, subRow: 0 },
    ];
    const layers = packItemsInRow(slices);
    expect(layers).toHaveLength(1);
    expect(layers[0][0].subRow).toBe(0);
    expect(layers[0][1].subRow).toBe(0);
  });

  it("puts overlapping items in different subRows", () => {
    const slices: RowItemSlice[] = [
      { item: { type: "audio", startTime: 0, endTime: 5, zIndex: 1 } as Item, visibleStart: 0, visibleEnd: 5, subRow: 0 },
      { item: { type: "audio", startTime: 3, endTime: 8, zIndex: 1 } as Item, visibleStart: 3, visibleEnd: 8, subRow: 0 },
    ];
    const layers = packItemsInRow(slices);
    expect(layers).toHaveLength(1);
    expect(layers[0][0].subRow).toBe(0);
    expect(layers[0][1].subRow).toBe(1);
  });
});
