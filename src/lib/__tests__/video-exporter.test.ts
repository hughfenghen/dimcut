import { describe, expect, it } from "vitest";
import { computeAudioPlacements } from "../video-exporter.ts";

describe("computeAudioPlacements", () => {
  it("places audio by item.startTime when there are no deleted ranges", () => {
    const placements = computeAudioPlacements(
      [{ start: 0, end: 10 }],
      3,
      7,
    );

    expect(placements).toEqual([
      {
        outputStart: 3,
        sourceStart: 0,
        duration: 4,
      },
    ]);
  });

  it("moves later slices forward on the compressed export timeline", () => {
    const placements = computeAudioPlacements(
      [
        { start: 0, end: 2 },
        { start: 4, end: 8 },
      ],
      1,
      6,
    );

    expect(placements).toEqual([
      {
        outputStart: 1,
        sourceStart: 0,
        duration: 1,
      },
      {
        outputStart: 2,
        sourceStart: 3,
        duration: 2,
      },
    ]);
  });

  it("splits one audio item across multiple kept segments", () => {
    const placements = computeAudioPlacements(
      [
        { start: 0, end: 1.5 },
        { start: 3, end: 4 },
        { start: 5, end: 7 },
      ],
      0.5,
      6,
    );

    expect(placements).toEqual([
      {
        outputStart: 0.5,
        sourceStart: 0,
        duration: 1,
      },
      {
        outputStart: 1.5,
        sourceStart: 2.5,
        duration: 1,
      },
      {
        outputStart: 2.5,
        sourceStart: 4.5,
        duration: 1,
      },
    ]);
  });
});
