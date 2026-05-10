import {
  Input,
  Output,
  VideoSampleSink,
  AudioSampleSink,
  VideoSampleSource,
  AudioSampleSource,
  AudioBufferSource,
  Mp4OutputFormat,
  StreamTarget,
  BlobSource,
  ALL_FORMATS,
} from "mediabunny";
import type { DeletedRange, Clip, IAudioItem } from "./types.ts";

interface Segment {
  start: number;
  end: number;
}

export interface AudioPlacement {
  outputStart: number;
  sourceStart: number;
  duration: number;
}

interface ExportPipeline<
  TAudioSource extends AudioSampleSource | AudioBufferSource,
> {
  input: Input;
  videoTrack: Awaited<ReturnType<Input["getPrimaryVideoTrack"]>>;
  audioTrack: Awaited<ReturnType<Input["getPrimaryAudioTrack"]>>;
  videoSource: VideoSampleSource;
  audioSource: TAudioSource;
  output: Output;
}

export function computeValidSegments(
  duration: number,
  deletedRanges: DeletedRange[],
): Segment[] {
  if (!deletedRanges.length) return [{ start: 0, end: duration }];

  const sorted = [...deletedRanges].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;

  for (const range of sorted) {
    if (range.start > cursor) {
      segments.push({ start: cursor, end: range.start });
    }
    cursor = Math.max(cursor, range.end);
  }

  if (cursor < duration) {
    segments.push({ start: cursor, end: duration });
  }

  return segments;
}

function computeTimeOffset(
  timestamp: number,
  deletedRanges: DeletedRange[],
): number {
  let offset = 0;
  for (const range of deletedRanges) {
    if (range.end <= timestamp) {
      offset += range.end - range.start;
    } else if (range.start < timestamp) {
      offset += timestamp - range.start;
    }
  }
  return offset;
}

function computeExportDuration(segments: Segment[]): number {
  return segments.reduce(
    (total, segment) => total + (segment.end - segment.start),
    0,
  );
}

export function computeAudioPlacements(
  segments: Segment[],
  rangeStart: number,
  rangeEnd: number,
  sourceOffset = rangeStart,
): AudioPlacement[] {
  const placements: AudioPlacement[] = [];
  let outputCursor = 0;

  for (const segment of segments) {
    const overlapStart = Math.max(segment.start, rangeStart);
    const overlapEnd = Math.min(segment.end, rangeEnd);

    if (overlapStart < overlapEnd) {
      placements.push({
        outputStart: outputCursor + (overlapStart - segment.start),
        sourceStart: overlapStart - sourceOffset,
        duration: overlapEnd - overlapStart,
      });
    }

    outputCursor += segment.end - segment.start;
  }

  return placements;
}

async function createExportPipeline<
  TAudioSource extends AudioSampleSource | AudioBufferSource,
>(
  file: File,
  audioSource: TAudioSource,
): Promise<ExportPipeline<TAudioSource>> {
  const fileHandle = await (window as any).showSaveFilePicker({
    suggestedName: "exported-video.mp4",
    types: [
      {
        description: "MP4 Video",
        accept: { "video/mp4": [".mp4"] },
      },
    ],
  });
  const writableStream = await fileHandle.createWritable();

  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });

  const videoTrack = await input.getPrimaryVideoTrack();
  const audioTrack = await input.getPrimaryAudioTrack();

  const videoSource = new VideoSampleSource({
    codec: "avc",
    bitrate: 5e6,
  });

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new StreamTarget(writableStream, { chunked: true }),
  });

  output.addVideoTrack(videoSource);
  output.addAudioTrack(audioSource);

  await output.start();

  return {
    input,
    videoTrack,
    audioTrack,
    videoSource,
    audioSource,
    output,
  };
}

async function finalizePipeline(
  pipeline: ExportPipeline<AudioSampleSource | AudioBufferSource>,
): Promise<void> {
  pipeline.videoSource.close();
  pipeline.audioSource.close();
  await pipeline.output.finalize();
}

async function addVideoSamples(
  pipeline: ExportPipeline<AudioSampleSource | AudioBufferSource>,
  segments: Segment[],
  sortedRanges: DeletedRange[],
): Promise<void> {
  if (!pipeline.videoTrack) return;

  const videoSink = new VideoSampleSink(pipeline.videoTrack);
  for (const segment of segments) {
    for await (const frame of videoSink.samples(segment.start, segment.end)) {
      const offset = computeTimeOffset(frame.timestamp, sortedRanges);
      frame.setTimestamp(frame.timestamp - offset);
      await pipeline.videoSource.add(frame);
      frame.close();
    }
  }
}

async function addPrimaryAudioSamples(
  pipeline: ExportPipeline<AudioSampleSource>,
  segments: Segment[],
  sortedRanges: DeletedRange[],
): Promise<void> {
  if (!pipeline.audioTrack) return;

  const audioSink = new AudioSampleSink(pipeline.audioTrack);
  for (const segment of segments) {
    for await (const sample of audioSink.samples(segment.start, segment.end)) {
      const offset = computeTimeOffset(sample.timestamp, sortedRanges);
      sample.setTimestamp(sample.timestamp - offset);
      await pipeline.audioSource.add(sample);
      sample.close();
    }
  }
}

async function decodeAudioFile(
  context: BaseAudioContext,
  file: File,
): Promise<AudioBuffer> {
  const data = await file.arrayBuffer();
  return context.decodeAudioData(data);
}

function scheduleAudioPlacements(
  context: OfflineAudioContext,
  buffer: AudioBuffer,
  placements: AudioPlacement[],
): void {
  for (const placement of placements) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(
      placement.outputStart,
      placement.sourceStart,
      placement.duration,
    );
  }
}

async function renderMixedAudio(
  file: File,
  segments: Segment[],
  duration: number,
  includeMainTrack: boolean,
  audioItems: IAudioItem[],
): Promise<AudioBuffer> {
  const sampleRate = 48_000;
  const decodeContext = new OfflineAudioContext(1, 1, sampleRate);
  const mainBuffer = includeMainTrack
    ? await decodeAudioFile(decodeContext, file)
    : null;
  const overlayBuffers = await Promise.all(
    audioItems.map(async (item) => ({
      item,
      buffer: await decodeAudioFile(decodeContext, item.file),
    })),
  );

  const numberOfChannels = Math.max(
    1,
    mainBuffer?.numberOfChannels ?? 0,
    ...overlayBuffers.map(({ buffer }) => buffer.numberOfChannels),
  );
  const exportDuration = computeExportDuration(segments);
  const frameCount = Math.max(1, Math.ceil(exportDuration * sampleRate));
  const mixContext = new OfflineAudioContext(
    numberOfChannels,
    frameCount,
    sampleRate,
  );

  if (mainBuffer) {
    scheduleAudioPlacements(
      mixContext,
      mainBuffer,
      computeAudioPlacements(segments, 0, duration, 0),
    );
  }

  for (const { item, buffer } of overlayBuffers) {
    scheduleAudioPlacements(
      mixContext,
      buffer,
      computeAudioPlacements(
        segments,
        item.startTime,
        item.endTime,
        item.startTime,
      ),
    );
  }

  return mixContext.startRendering();
}

export async function exportVideo(
  file: File,
  deletedRanges: DeletedRange[],
  duration: number,
  audioItems?: IAudioItem[],
): Promise<void> {
  const segments = computeValidSegments(duration, deletedRanges);
  if (segments.length === 0) return;

  const sortedRanges = [...deletedRanges].sort((a, b) => a.start - b.start);
  const overlayAudioItems = audioItems ?? [];

  if (overlayAudioItems.length > 0) {
    const pipeline = await createExportPipeline(
      file,
      new AudioBufferSource({
        codec: "aac",
        bitrate: 128e3,
      }),
    );

    await addVideoSamples(pipeline, segments, sortedRanges);

    const mixedAudio = await renderMixedAudio(
      file,
      segments,
      duration,
      pipeline.audioTrack != null,
      overlayAudioItems,
    );
    await pipeline.audioSource.add(mixedAudio);

    await finalizePipeline(pipeline);
    return;
  }

  const pipeline = await createExportPipeline(
    file,
    new AudioSampleSource({
      codec: "aac",
      bitrate: 128e3,
    }),
  );

  await addVideoSamples(pipeline, segments, sortedRanges);
  await addPrimaryAudioSamples(pipeline, segments, sortedRanges);
  await finalizePipeline(pipeline);
}

export async function exportClips(file: File, clips: Clip[]): Promise<void> {
  if (clips.length === 0) return;

  const pipeline = await createExportPipeline(
    file,
    new AudioSampleSource({
      codec: "aac",
      bitrate: 128e3,
    }),
  );
  let accumulatedDuration = 0;

  // Process video frames
  if (pipeline.videoTrack) {
    const videoSink = new VideoSampleSink(pipeline.videoTrack);
    for (const clip of clips) {
      for await (const frame of videoSink.samples(clip.start, clip.end)) {
        frame.setTimestamp(
          Math.max(0, frame.timestamp - clip.start + accumulatedDuration),
        );
        await pipeline.videoSource.add(frame);
        frame.close();
      }
      accumulatedDuration += clip.end - clip.start;
    }
  }

  // Reset for audio pass
  accumulatedDuration = 0;

  // Process audio samples
  if (pipeline.audioTrack) {
    const audioSink = new AudioSampleSink(pipeline.audioTrack);
    for (const clip of clips) {
      for await (const sample of audioSink.samples(clip.start, clip.end)) {
        sample.setTimestamp(
          Math.max(0, sample.timestamp - clip.start + accumulatedDuration),
        );
        await pipeline.audioSource.add(sample);
        sample.close();
      }
      accumulatedDuration += clip.end - clip.start;
    }
  }

  await finalizePipeline(pipeline);
}
