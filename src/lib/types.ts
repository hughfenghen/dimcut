export interface AsrWord {
  word: string;
  start: number;
  end: number;
}

export interface AsrSegment {
  start: number;
  end: number;
  text: string;
  words: AsrWord[];
}

export interface AsrData {
  segments: AsrSegment[];
  language: string;
}

export interface IItem {
  id: string;
  type: string;
  startTime: number;
  endTime: number;
  zIndex: number;
}

export interface IMediaItem extends IItem {
  file?: File;
}

export interface IVideoItem extends IMediaItem {
  type: "video";
}

export interface IAudioItem extends IMediaItem {
  type: "audio";
}

export interface IImageItem extends IMediaItem {
  type: "image";
}

export interface ITextItem extends IItem {
  type: "text";
  text: string;
}

export type Item = IVideoItem | IAudioItem | IImageItem | ITextItem;

export interface IMainTrackConf {
  item: IVideoItem | IAudioItem;
  asrData?: AsrData;
}

export interface DeletedRange {
  start: number;
  end: number;
}

export interface IChangeEventData {
  items: Item[];
  mainTrackConf: IMainTrackConf;
  deletedRanges?: DeletedRange[];
}

export interface SelectionMenuItem {
  icon: () => any;
  label: string;
  onClick: (selection: { start: number; end: number }) => void;
}

export interface TimelineProps {
  data: IChangeEventData;
  pixelsPerSecond?: number;
  onChange?: (data: IChangeEventData) => void;
  selectionMenuItems?: SelectionMenuItem[];
}

export interface RowLayout {
  rowIndex: number;
  startTime: number;
  endTime: number;
}

export interface RowItemSlice {
  item: Item;
  visibleStart: number;
  visibleEnd: number;
  subRow: number;
}

export interface RowData {
  layout: RowLayout;
  layers: RowItemSlice[][];
}
