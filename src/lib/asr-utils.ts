import type { AsrData, AsrSegment, AsrWord, DeletedRange } from "./types.ts";

export interface AsrWordView extends AsrWord {
  isDeleted: boolean;
}

export function rangesIntersect(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return endA > startB && startA < endB;
}

export function getAsrWordsForRow(
  asrData: AsrData,
  rowStartTime: number,
  rowEndTime: number,
): AsrWord[] {
  const words: AsrWord[] = [];
  for (const seg of asrData.segments) {
    for (const w of seg.words) {
      if (w.start >= rowStartTime && w.start < rowEndTime) {
        words.push({ word: w.word, start: w.start, end: w.end });
      }
    }
  }
  words.sort((a, b) => a.start - b.start);
  return words;
}

export function getAsrSegmentsForRow(
  asrData: AsrData,
  rowStartTime: number,
  rowEndTime: number,
): AsrSegment[] {
  const segments: AsrSegment[] = [];
  for (const seg of asrData.segments) {
    const words: AsrWord[] = [];
    for (const w of seg.words) {
      if (w.start >= rowStartTime && w.start < rowEndTime) {
        words.push({ word: w.word, start: w.start, end: w.end });
      }
    }
    if (words.length > 0) {
      segments.push({
        start: words[0].start,
        end: words[words.length - 1].end,
        text: words.map((w) => w.word).join(""),
        words,
      });
    }
  }
  return segments;
}

export function isAsrWordDeleted(word: AsrWord, deletedRanges: DeletedRange[]): boolean {
  for (const range of deletedRanges) {
    if (rangesIntersect(word.start, word.end, range.start, range.end)) {
      return true;
    }
  }
  return false;
}
