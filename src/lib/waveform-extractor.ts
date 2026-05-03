import { Input, ALL_FORMATS, BlobSource, AudioBufferSink } from "mediabunny";

export class WaveformExtractor {
  private file: File;
  private input: InstanceType<typeof Input> | null = null;
  private audioTrack: any = null;
  private sink: InstanceType<typeof AudioBufferSink> | null = null;
  private duration: number = 0;
  private firstTimestamp: number = 0;
  private initPromise: Promise<void> | null = null;
  // Cache: pps -> Float32Array (full waveform peaks, one per pixel)
  private cache: Map<number, Float32Array> = new Map();

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

    this.audioTrack = await this.input.getPrimaryAudioTrack();
    if (!this.audioTrack) return;

    this.firstTimestamp = await this.audioTrack.getFirstTimestamp();
    const endTimestamp = await this.audioTrack.computeDuration();
    this.duration = endTimestamp - this.firstTimestamp;
    this.sink = new AudioBufferSink(this.audioTrack);
  }

  hasAudioTrack(): boolean {
    return this.audioTrack != null;
  }

  getDuration(): number {
    return this.duration;
  }

  /**
   * Extract waveform peak data for a time range at the given pps.
   * Returns a Float32Array with one peak value (0~1) per pixel.
   * Uses full-duration cache keyed by pps.
   */
  async extract(
    startTime: number,
    endTime: number,
    pps: number,
  ): Promise<Float32Array> {
    if (!this.sink || !this.audioTrack) return new Float32Array(0);

    // Get or build full waveform cache for this pps
    let fullPeaks = this.cache.get(pps);
    if (!fullPeaks) {
      fullPeaks = await this.buildFullPeaks(pps);
      // Clear old cache entries (only keep current pps)
      this.cache.clear();
      this.cache.set(pps, fullPeaks);
    }

    // Slice the portion we need
    const startPixel = Math.floor(startTime * pps);
    const endPixel = Math.ceil(endTime * pps);
    const clampedStart = Math.max(0, startPixel);
    const clampedEnd = Math.min(fullPeaks.length, endPixel);

    if (clampedStart >= clampedEnd) return new Float32Array(0);
    return fullPeaks.slice(clampedStart, clampedEnd);
  }

  private async buildFullPeaks(pps: number): Promise<Float32Array> {
    if (!this.sink) return new Float32Array(0);

    const totalPixels = Math.ceil(this.duration * pps);
    const peaks = new Float32Array(totalPixels);
    // Collect all PCM data from buffers
    for await (const { buffer, timestamp } of this.sink.buffers()) {
      const channelData = buffer.getChannelData(0);
      const bufferStartTime = timestamp - this.firstTimestamp;

      for (let i = 0; i < channelData.length; i++) {
        const sampleTime = bufferStartTime + i / buffer.sampleRate;
        const pixelIndex = Math.floor(sampleTime * pps);
        if (pixelIndex >= 0 && pixelIndex < totalPixels) {
          const absVal = Math.abs(channelData[i]);
          if (absVal > peaks[pixelIndex]) {
            peaks[pixelIndex] = absVal;
          }
        }
      }
    }

    return peaks;
  }

  dispose(): void {
    this.cache.clear();
    this.sink = null;
    this.audioTrack = null;
    this.input = null;
    this.initPromise = null;
  }
}
