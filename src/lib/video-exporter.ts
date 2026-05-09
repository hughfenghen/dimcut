import {
  Input,
  Output,
  VideoSampleSink,
  AudioSampleSink,
  VideoSampleSource,
  AudioSampleSource,
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

interface ExportPipeline {
  input: Input;
  videoTrack: Awaited<ReturnType<Input["getPrimaryVideoTrack"]>>;
  audioTrack: Awaited<ReturnType<Input["getPrimaryAudioTrack"]>>;
  videoSource: VideoSampleSource;
  audioSource: AudioSampleSource;
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

async function createExportPipeline(file: File): Promise<ExportPipeline> {
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

  const audioSource = new AudioSampleSource({
    codec: "aac",
    bitrate: 128e3,
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

async function finalizePipeline(pipeline: ExportPipeline): Promise<void> {
  pipeline.videoSource.close();
  pipeline.audioSource.close();
  await pipeline.output.finalize();
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
  const pipeline = await createExportPipeline(file);

  // Process video frames
  if (pipeline.videoTrack) {
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

  // Process main track audio samples
  if (pipeline.audioTrack) {
    const audioSink = new AudioSampleSink(pipeline.audioTrack);
    for (const segment of segments) {
      for await (const sample of audioSink.samples(
        segment.start,
        segment.end,
      )) {
        const offset = computeTimeOffset(sample.timestamp, sortedRanges);
        sample.setTimestamp(sample.timestamp - offset);
        await pipeline.audioSource.add(sample);
        sample.close();
      }
    }
  }

  // Process overlay audio items
  if (audioItems && audioItems.length > 0) {
    for (const audioItem of audioItems) {
      const itemDuration = audioItem.endTime - audioItem.startTime;
      const itemInput = new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(audioItem.file),
      });
      const itemAudioTrack = await itemInput.getPrimaryAudioTrack();
      if (!itemAudioTrack) continue;

      const itemAudioSink = new AudioSampleSink(itemAudioTrack);

      for (const segment of segments) {
        const overlapStart = Math.max(segment.start, audioItem.startTime);
        const overlapEnd = Math.min(segment.end, audioItem.endTime);
        if (overlapStart >= overlapEnd) continue;

        const fileStart = overlapStart - audioItem.startTime;
        const fileEnd = overlapEnd - audioItem.startTime;

        for await (const sample of itemAudioSink.samples(fileStart, fileEnd)) {
          const absTime = sample.timestamp + audioItem.startTime;
          const clampedAbs = Math.max(overlapStart, Math.min(absTime, overlapEnd));
          const offset = computeTimeOffset(clampedAbs, sortedRanges);
          sample.setTimestamp(Math.max(0, clampedAbs - offset));
          await pipeline.audioSource.add(sample);
          sample.close();
        }
      }
    }
  }

  await finalizePipeline(pipeline);
}

export async function exportClips(
  file: File,
  clips: Clip[],
): Promise<void> {
  if (clips.length === 0) return;

  const pipeline = await createExportPipeline(file);
  let accumulatedDuration = 0;

  // Process video frames
  if (pipeline.videoTrack) {
    const videoSink = new VideoSampleSink(pipeline.videoTrack);
    for (const clip of clips) {
      for await (const frame of videoSink.samples(clip.start, clip.end)) {
        frame.setTimestamp(Math.max(0, frame.timestamp - clip.start + accumulatedDuration));
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
        sample.setTimestamp(Math.max(0, sample.timestamp - clip.start + accumulatedDuration));
        await pipeline.audioSource.add(sample);
        sample.close();
      }
      accumulatedDuration += clip.end - clip.start;
    }
  }

  await finalizePipeline(pipeline);
}
