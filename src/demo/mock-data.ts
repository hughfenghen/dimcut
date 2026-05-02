import type { IChangeEventData } from "../lib/types.ts";

export const mockData: IChangeEventData = {
  mainTrackConf: {
    item: {
      id: "main-video",
      type: "video",
      startTime: 0,
      endTime: 30,
      zIndex: 0,
    },
    asrData: {
      language: "en",
      segments: [
        {
          start: 0,
          end: 5,
          text: "this is transcript text here",
          words: [
            { word: "this", start: 0, end: 1.2 },
            { word: "is", start: 1.5, end: 2 },
            { word: "transcript", start: 3, end: 4.2 },
            { word: "text", start: 4.5, end: 5 },
          ],
        },
        {
          start: 5,
          end: 10,
          text: "here is more content to show",
          words: [
            { word: "here", start: 5, end: 5.8 },
            { word: "is", start: 6, end: 6.4 },
            { word: "more", start: 6.8, end: 7.3 },
            { word: "content", start: 7.5, end: 8.2 },
          ],
        },
        {
          start: 10,
          end: 15,
          text: "this is the second row",
          words: [
            { word: "this", start: 10, end: 10.8 },
            { word: "is", start: 11.2, end: 11.6 },
            { word: "the", start: 12, end: 12.5 },
            { word: "second", start: 13, end: 13.8 },
            { word: "row", start: 14, end: 14.5 },
          ],
        },
        {
          start: 20,
          end: 25,
          text: "this is transcript continued",
          words: [
            { word: "this", start: 20, end: 20.8 },
            { word: "is", start: 21, end: 21.5 },
            { word: "transcript", start: 22, end: 23 },
            { word: "continued", start: 23.5, end: 24.5 },
          ],
        },
      ],
    },
  },
  items: [
    {
      id: "audio-1",
      type: "audio",
      startTime: 8,
      endTime: 13,
      zIndex: 1,
    },
    {
      id: "audio-2",
      type: "audio",
      startTime: 15,
      endTime: 18,
      zIndex: 1,
    },
    {
      id: "image-1",
      type: "image",
      startTime: 14,
      endTime: 18,
      zIndex: 2,
    },
    {
      id: "sfx-1",
      type: "text",
      startTime: 5,
      endTime: 8,
      zIndex: 1,
      text: "SFX",
    },
  ],
  deletedRanges: [
    { start: 11, end: 13 },
  ],
};
