import type { AsrData, AsrWord, DeletedRange } from "./types.ts";

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

export function isAsrWordDeleted(word: AsrWord, deletedRanges: DeletedRange[]): boolean {
  for (const range of deletedRanges) {
    if (rangesIntersect(word.start, word.end, range.start, range.end)) {
      return true;
    }
  }
  return false;
}
