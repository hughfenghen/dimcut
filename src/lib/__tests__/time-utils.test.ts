import { describe, it, expect } from "vitest";
import { timeToPixel, pixelToTime, formatTime, mergeDeletedRanges } from "../time-utils.ts";

describe("timeToPixel", () => {
  it("converts time at row start to 0px", () => {
    expect(timeToPixel(10, 10, 80)).toBe(0);
  });

  it("converts time offset by pixelsPerSecond", () => {
    expect(timeToPixel(12, 10, 80)).toBe(160);
  });

  it("handles fractional seconds", () => {
    expect(timeToPixel(10.5, 10, 100)).toBeCloseTo(50);
  });
});

describe("pixelToTime", () => {
  it("converts 0px to row start time", () => {
    expect(pixelToTime(0, 10, 80)).toBe(10);
  });

  it("converts pixels back to time", () => {
    expect(pixelToTime(160, 10, 80)).toBe(12);
  });

  it("is inverse of timeToPixel", () => {
    const time = 15.3;
    const rowStart = 10;
    const pps = 80;
    const px = timeToPixel(time, rowStart, pps);
    expect(pixelToTime(px, rowStart, pps)).toBeCloseTo(time);
  });
});

describe("formatTime", () => {
  it("formats 0 seconds", () => {
    expect(formatTime(0)).toBe("00:00.00");
  });

  it("formats seconds with padding", () => {
    expect(formatTime(5)).toBe("00:05.00");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(65)).toBe("01:05.00");
  });

  it("shows two decimal places", () => {
    expect(formatTime(9.7)).toBe("00:09.70");
  });

  it("formats fractional seconds with two decimals", () => {
    expect(formatTime(65.42)).toBe("01:05.42");
  });
});

describe("mergeDeletedRanges", () => {
  it("returns empty array for empty input", () => {
    expect(mergeDeletedRanges([])).toEqual([]);
  });

  it("returns single range unchanged", () => {
    expect(mergeDeletedRanges([{ start: 1, end: 3 }])).toEqual([{ start: 1, end: 3 }]);
  });

  it("merges overlapping ranges", () => {
    expect(
      mergeDeletedRanges([
        { start: 1, end: 3 },
        { start: 2, end: 4 },
      ]),
    ).toEqual([{ start: 1, end: 4 }]);
  });

  it("merges adjacent ranges", () => {
    expect(
      mergeDeletedRanges([
        { start: 1, end: 3 },
        { start: 3, end: 5 },
      ]),
    ).toEqual([{ start: 1, end: 5 }]);
  });

  it("does not merge non-overlapping ranges", () => {
    expect(
      mergeDeletedRanges([
        { start: 1, end: 2 },
        { start: 4, end: 5 },
      ]),
    ).toEqual([
      { start: 1, end: 2 },
      { start: 4, end: 5 },
    ]);
  });

  it("handles fully contained range", () => {
    expect(
      mergeDeletedRanges([
        { start: 1, end: 5 },
        { start: 2, end: 3 },
      ]),
    ).toEqual([{ start: 1, end: 5 }]);
  });

  it("merges multiple overlapping ranges", () => {
    expect(
      mergeDeletedRanges([
        { start: 5, end: 8 },
        { start: 1, end: 3 },
        { start: 2, end: 6 },
      ]),
    ).toEqual([{ start: 1, end: 8 }]);
  });
});
