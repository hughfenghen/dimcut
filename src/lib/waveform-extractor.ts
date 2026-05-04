import { Input, ALL_FORMATS, BlobSource, AudioBufferSink } from "mediabunny";

const RAW_PEAKS_PER_SEC = 1000;

export class WaveformExtractor {
  private file: File;
  private input: InstanceType<typeof Input> | null = null;
  private audioTrack: any = null;
  private sink: InstanceType<typeof AudioBufferSink> | null = null;
  private duration: number = 0;
  private firstTimestamp: number = 0;
  private initPromise: Promise<void> | null = null;
  private rawPeaks: Float32Array = new Float32Array(0);

  constructor(file: File) {
    this.file = file;
  }

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    console.time("[Waveform] init total");

    this.input = new Input({
      formats: ALL_FORMATS,
      source: new BlobSource(this.file),
    });

    this.audioTrack = await this.input.getPrimaryAudioTrack();
    if (!this.audioTrack) {
      console.timeEnd("[Waveform] init total");
      return;
    }

    this.firstTimestamp = await this.audioTrack.getFirstTimestamp();
    const endTimestamp = await this.audioTrack.computeDuration();
    this.duration = endTimestamp - this.firstTimestamp;
    this.sink = new AudioBufferSink(this.audioTrack);

    console.time("[Waveform] decode + buildRawPeaks");
    this.rawPeaks = await this.buildRawPeaks();
    console.timeEnd("[Waveform] decode + buildRawPeaks");

    console.timeEnd("[Waveform] init total");
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
   * Downsamples from pre-built rawPeaks — no audio decoding.
   */
  extract(startTime: number, endTime: number, pps: number): Float32Array {
    if (this.rawPeaks.length === 0) return new Float32Array(0);

    console.time("[Waveform] extract downsample");

    const totalPixels = Math.ceil((endTime - startTime) * pps);
    const result = new Float32Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      const t0 = startTime + i / pps;
      const t1 = startTime + (i + 1) / pps;

      const rawStart = Math.max(0, Math.floor(t0 * RAW_PEAKS_PER_SEC));
      const rawEnd = Math.min(this.rawPeaks.length, Math.ceil(t1 * RAW_PEAKS_PER_SEC));

      let peak = 0;
      for (let j = rawStart; j < rawEnd; j++) {
        if (this.rawPeaks[j] > peak) peak = this.rawPeaks[j];
      }
      result[i] = peak;
    }

    console.timeEnd("[Waveform] extract downsample");
    return result;
  }

  private async buildRawPeaks(): Promise<Float32Array> {
    if (!this.sink) return new Float32Array(0);

    const totalPeaks = Math.ceil(this.duration * RAW_PEAKS_PER_SEC);
    const peaks = new Float32Array(totalPeaks);

    for await (const { buffer, timestamp } of this.sink.buffers()) {
      const channelData = buffer.getChannelData(0);
      const bufferStartTime = timestamp - this.firstTimestamp;
      const sampleRate = buffer.sampleRate;

      // Compute the raw peak index for the first sample of this buffer
      const firstPeakIndex = Math.floor(bufferStartTime * RAW_PEAKS_PER_SEC);

      for (let peakIdx = firstPeakIndex; peakIdx < totalPeaks; peakIdx++) {
        // Time range this peak covers
        const peakStartTime = peakIdx / RAW_PEAKS_PER_SEC;
        const peakEndTime = (peakIdx + 1) / RAW_PEAKS_PER_SEC;

        // Sample range within this buffer
        const sampleStart = Math.max(0, Math.floor((peakStartTime - bufferStartTime) * sampleRate));
        const sampleEnd = Math.min(channelData.length, Math.ceil((peakEndTime - bufferStartTime) * sampleRate));

        if (sampleStart >= channelData.length) break;
        if (sampleEnd <= 0) continue;

        let peak = peaks[peakIdx];
        for (let s = sampleStart; s < sampleEnd; s++) {
          const absVal = Math.abs(channelData[s]);
          if (absVal > peak) peak = absVal;
        }
        peaks[peakIdx] = peak;
      }
    }

    return peaks;
  }

  dispose(): void {
    this.rawPeaks = new Float32Array(0);
    this.sink = null;
    this.audioTrack = null;
    this.input = null;
    this.initPromise = null;
  }
}
