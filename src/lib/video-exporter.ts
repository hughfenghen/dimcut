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
import type { DeletedRange } from "./types.ts";

interface Segment {
  start: number;
  end: number;
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

export async function exportVideo(
  file: File,
  deletedRanges: DeletedRange[],
  duration: number,
): Promise<void> {
  const segments = computeValidSegments(duration, deletedRanges);
  if (segments.length === 0) return;

  const sortedRanges = [...deletedRanges].sort((a, b) => a.start - b.start);

  const fileHandle = await window.showSaveFilePicker({
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

  // Process video frames
  if (videoTrack) {
    const videoSink = new VideoSampleSink(videoTrack);
    for (const segment of segments) {
      for await (const frame of videoSink.samples(segment.start, segment.end)) {
        const offset = computeTimeOffset(frame.timestamp, sortedRanges);
        frame.setTimestamp(frame.timestamp - offset);
        await videoSource.add(frame);
        frame.close();
      }
    }
  }
  videoSource.close();

  // Process audio samples
  if (audioTrack) {
    const audioSink = new AudioSampleSink(audioTrack);
    for (const segment of segments) {
      for await (const sample of audioSink.samples(
        segment.start,
        segment.end,
      )) {
        const offset = computeTimeOffset(sample.timestamp, sortedRanges);
        sample.setTimestamp(sample.timestamp - offset);
        await audioSource.add(sample);
        sample.close();
      }
    }
  }
  audioSource.close();

  await output.finalize();
  await writableStream.close();
}
