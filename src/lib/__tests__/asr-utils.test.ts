import { describe, expect, it } from "vitest";
import { getAsrWordsForRow, isAsrWordDeleted } from "../asr-utils.ts";
import type { AsrData } from "../types.ts";

const mockAsrData: AsrData = {
  language: "zh",
  segments: [
    {
      start: 0,
      end: 20,
      text: "",
      words: [
        { word: "A", start: 9.8, end: 10.2 },
        { word: "B", start: 10.0, end: 10.4 },
        { word: "C", start: 12.2, end: 12.5 },
      ],
    },
  ],
};

describe("getAsrWordsForRow", () => {
  it("assigns words by start time only", () => {
    const row0 = getAsrWordsForRow(mockAsrData, 0, 10);
    const row1 = getAsrWordsForRow(mockAsrData, 10, 20);

    expect(row0.map((w) => w.word)).toEqual(["A"]);
    expect(row1.map((w) => w.word)).toEqual(["B", "C"]);
  });

  it("keeps row result ordered by word start", () => {
    const row1 = getAsrWordsForRow(mockAsrData, 10, 20);
    expect(row1.map((w) => w.start)).toEqual([10, 12.2]);
  });
});

describe("isAsrWordDeleted", () => {
  it("returns true when word intersects deleted range", () => {
    const result = isAsrWordDeleted(
      { word: "B", start: 10, end: 10.4 },
      [{ start: 10.3, end: 11 }],
    );

    expect(result).toBe(true);
  });

  it("returns false when word does not intersect deleted range", () => {
    const result = isAsrWordDeleted(
      { word: "C", start: 12.2, end: 12.5 },
      [{ start: 10, end: 11 }],
    );

    expect(result).toBe(false);
  });
});
