import { type Component, createSignal, createEffect, on, onCleanup, Show } from "solid-js";
import type { IMainTrackConf, DeletedRange, Item, IAudioItem } from "./types.ts";

export interface PreviewPlayerProps {
  mainTrackConf: IMainTrackConf;
  currentTime: number;
  isPlaying: boolean;
  deletedRanges?: DeletedRange[];
  items?: Item[];
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
}

export const PreviewPlayer: Component<PreviewPlayerProps> = (props) => {
  let videoRef: HTMLVideoElement | undefined;
  let audioRef: HTMLAudioElement | undefined;
  let rafId: number | undefined;

  const isVideo = () => props.mainTrackConf.item.type === "video";

  const [objectUrl, setObjectUrl] = createSignal<string>("");

  const overlayAudioMap = new Map<string, { el: HTMLAudioElement; url: string }>();

  const audioItems = () =>
    (props.items ?? []).filter(
      (it): it is IAudioItem => it.type === "audio" && "file" in it,
    );

  const skipIfDeleted = (time: number): number => {
    const ranges = props.deletedRanges;
    if (!ranges) return time;
    for (const r of ranges) {
      if (time >= r.start && time < r.end) return r.end;
    }
    return time;
  };

  createEffect(
    on(
      () => props.mainTrackConf.item.file,
      (file) => {
        const prev = objectUrl();
        if (prev) URL.revokeObjectURL(prev);
        setObjectUrl(URL.createObjectURL(file));
      },
    ),
  );

  createEffect(
    on(audioItems, (items) => {
      const currentIds = new Set(items.map((it) => it.id));
      for (const [id, entry] of overlayAudioMap) {
        if (!currentIds.has(id)) {
          entry.el.pause();
          URL.revokeObjectURL(entry.url);
          overlayAudioMap.delete(id);
        }
      }
      for (const item of items) {
        if (!overlayAudioMap.has(item.id)) {
          const url = URL.createObjectURL(item.file);
          const el = new Audio(url);
          overlayAudioMap.set(item.id, { el, url });
        }
      }
    }),
  );

  onCleanup(() => {
    const url = objectUrl();
    if (url) URL.revokeObjectURL(url);
    if (rafId !== undefined) cancelAnimationFrame(rafId);
    for (const [, entry] of overlayAudioMap) {
      entry.el.pause();
      URL.revokeObjectURL(entry.url);
    }
    overlayAudioMap.clear();
  });

  const mediaEl = () => (isVideo() ? videoRef : audioRef);

  let isSelfUpdate = false;

  const syncOverlayAudio = (mainTime: number, playing: boolean) => {
    for (const item of audioItems()) {
      const entry = overlayAudioMap.get(item.id);
      if (!entry) continue;

      const inRange =
        mainTime >= item.startTime && mainTime < item.endTime;

      if (playing && inRange) {
        const localTime = mainTime - item.startTime;
        const skipped = skipIfDeleted(localTime + item.startTime) - item.startTime;
        if (Math.abs(entry.el.currentTime - skipped) > 0.15) {
          entry.el.currentTime = Math.max(0, skipped);
        }
        if (entry.el.paused) {
          entry.el.play().catch(() => {});
        }
      } else {
        if (!entry.el.paused) {
          entry.el.pause();
        }
      }
    }
  };

  createEffect(
    on(
      () => props.currentTime,
      (time) => {
        if (isSelfUpdate) return;
        const el = mediaEl();
        if (!el) return;
        const target = skipIfDeleted(time);
        if (Math.abs(el.currentTime - target) > 0.1) {
          el.currentTime = target;
        }
        syncOverlayAudio(time, props.isPlaying);
      },
    ),
  );

  createEffect(
    on(
      () => props.isPlaying,
      (playing) => {
        const el = mediaEl();
        if (!el) return;
        if (playing && el.paused) {
          el.play();
          startRAF();
        } else if (!playing && !el.paused) {
          el.pause();
          stopRAF();
        }
        syncOverlayAudio(props.currentTime, playing);
      },
    ),
  );

  const startRAF = () => {
    stopRAF();
    const tick = () => {
      const el = mediaEl();
      if (el && !el.paused) {
        const skipped = skipIfDeleted(el.currentTime);
        if (skipped !== el.currentTime) {
          el.currentTime = skipped;
        }
        isSelfUpdate = true;
        props.onTimeUpdate(el.currentTime);
        isSelfUpdate = false;
        syncOverlayAudio(el.currentTime, true);
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
  };

  const stopRAF = () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
  };

  const togglePlay = () => {
    const el = mediaEl();
    if (!el) return;
    if (el.paused) {
      props.onPlayPause(true);
    } else {
      props.onPlayPause(false);
    }
  };

  const handleEnded = () => {
    stopRAF();
    props.onPlayPause(false);
    for (const [, entry] of overlayAudioMap) {
      if (!entry.el.paused) entry.el.pause();
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const duration = () => props.mainTrackConf.item.endTime - props.mainTrackConf.item.startTime;

  return (
    <div class="w-full">
      <Show when={isVideo()}>
        <video
          ref={videoRef}
          src={objectUrl()}
          class="w-full bg-black"
          onEnded={handleEnded}
        />
      </Show>
      <Show when={!isVideo()}>
        <audio ref={audioRef} src={objectUrl()} onEnded={handleEnded} />
        <div class="w-full h-20 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Audio Only
        </div>
      </Show>

      {/* Controls */}
      <div class="flex items-center gap-3 mt-2 px-1">
        <button
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={togglePlay}
        >
          <Show
            when={props.isPlaying}
            fallback={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
              </svg>
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
            </svg>
          </Show>
        </button>
        <span class="text-xs text-gray-600 font-mono">
          {formatTime(props.currentTime)} / {formatTime(duration())}
        </span>
      </div>
    </div>
  );
};
