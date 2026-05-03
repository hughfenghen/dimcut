import { Input, ALL_FORMATS, BlobSource, CanvasSink } from "mediabunny";
import { MAIN_TRACK_HEIGHT } from "./constants.ts";

export interface ThumbnailParams {
  thumbnailWidth: number;
  step: number;
  count: number;
}

export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
}

export function computeThumbnailParams(
  pps: number,
  videoWidth: number,
  videoHeight: number,
  duration: number,
): ThumbnailParams {
  const thumbnailWidth = Math.round(
    MAIN_TRACK_HEIGHT * (videoWidth / videoHeight),
  );
  const step = thumbnailWidth / pps;
  const count = Math.ceil(duration / step);
  return { thumbnailWidth, step, count };
}

export class ThumbnailExtractor {
  private file: File;
  private input: InstanceType<typeof Input> | null = null;
  private videoTrack: any = null;
  private sink: InstanceType<typeof CanvasSink> | null = null;
  private videoInfo: VideoInfo | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(file: File) {
    this.file = file;
  }

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    this.input = new Input({
      formats: ALL_FORMATS,
      source: new BlobSource(this.file),
    });

    this.videoTrack = await this.input.getPrimaryVideoTrack();

    const startTimestamp = await this.videoTrack.getFirstTimestamp();
    const duration = await this.videoTrack.computeDuration();

    const trackWidth = this.videoTrack.width ?? 1920;
    const trackHeight = this.videoTrack.height ?? 1080;

    this.videoInfo = {
      width: trackWidth,
      height: trackHeight,
      duration: duration - startTimestamp,
    };

    const thumbWidth = Math.round(
      MAIN_TRACK_HEIGHT * (trackWidth / trackHeight),
    );

    this.sink = new CanvasSink(this.videoTrack, {
      width: thumbWidth,
      height: MAIN_TRACK_HEIGHT,
      fit: "cover",
    });
  }

  getVideoInfo(): VideoInfo | null {
    return this.videoInfo;
  }

  async *extract(
    startTime: number,
    endTime: number,
    step: number,
  ): AsyncGenerator<{ time: number; canvas: HTMLCanvasElement | OffscreenCanvas }> {
    if (!this.sink || !this.videoTrack) return;

    const firstTimestamp = await this.videoTrack.getFirstTimestamp();
    const timestamps: number[] = [];
    for (let t = startTime; t < endTime; t += step) {
      timestamps.push(firstTimestamp + t);
    }
    if (timestamps.length === 0) return;

    let idx = 0;
    for await (const result of this.sink.canvasesAtTimestamps(timestamps)) {
      if (result) {
        yield { time: timestamps[idx] - firstTimestamp, canvas: result.canvas };
      }
      idx++;
    }
  }

  dispose(): void {
    this.sink = null;
    this.videoTrack = null;
    this.input = null;
    this.initPromise = null;
  }
}
