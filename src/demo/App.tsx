import {
  type Component,
  createSignal,
  onMount,
  For,
  Show,
} from "solid-js";
import { Timeline } from "../lib/index.ts";
import { PreviewPlayer } from "../lib/PreviewPlayer.tsx";
import { exportVideo, exportClips } from "../lib/video-exporter.ts";
import { formatTime } from "../lib/time-utils.ts";
import type {
  AsrData,
  DeletedRange,
  IChangeEventData,
  IMainTrackConf,
  Item,
  Clip,
  SelectionMenuItem,
} from "../lib/types.ts";
import { AssetManagerModal } from "./AssetManagerModal.tsx";

async function loadDemoData(): Promise<IChangeEventData> {
  const [videoResp, asrResp] = await Promise.all([
    fetch("/example-video.mp4"),
    fetch("/example-video-asr.json"),
  ]);

  const videoBlob = await videoResp.blob();
  const videoFile = new File([videoBlob], "example-video.mp4", {
    type: "video/mp4",
  });

  const asrData: AsrData = await asrResp.json();
  asrData.filename = "example-video-asr.json";

  const duration = await getVideoDuration(videoFile);

  return {
    mainTrackConf: {
      item: {
        id: "main-video",
        type: "video",
        startTime: 0,
        endTime: duration,
        zIndex: 0,
        file: videoFile,
      },
      asrData,
    },
    items: [],
    deletedRanges: [],
  };
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      resolve(30);
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  });
}

function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      resolve(5);
      return;
    }
    const el = file.type.startsWith("video/")
      ? document.createElement("video")
      : document.createElement("audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      resolve(el.duration);
      URL.revokeObjectURL(el.src);
    };
    el.onerror = () => {
      resolve(5);
      URL.revokeObjectURL(el.src);
    };
    el.src = URL.createObjectURL(file);
  });
}

const App: Component = () => {
  const [data, setData] = createSignal<IChangeEventData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [mainTrackDeleted, setMainTrackDeleted] = createSignal(false);
  const [asrDeleted, setAsrDeleted] = createSignal(false);
  const [showTimeline, setShowTimeline] = createSignal(true);
  const [showAssetsModal, setShowAssetsModal] = createSignal(false);

  const [pps, setPps] = createSignal(80);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [showAsrTrack, setShowAsrTrack] = createSignal(true);
  const [showMediaTracks, setShowMediaTracks] = createSignal(true);
  const [deletedRanges, setDeletedRanges] = createSignal<DeletedRange[]>([]);
  const [exporting, setExporting] = createSignal(false);
  const [clips, setClips] = createSignal<Clip[]>([]);
  const [exportingClips, setExportingClips] = createSignal(false);
  const [dragIndex, setDragIndex] = createSignal<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);

  onMount(async () => {
    const d = await loadDemoData();
    setData(d);
    setLoading(false);
  });

  const bumpVersion = () => {
    setShowTimeline(false);
    queueMicrotask(() => setShowTimeline(true));
  };

  const handleReplaceMainTrack = async (file: File) => {
    const d = data();
    if (!d) return;
    const duration = await getMediaDuration(file);
    const isVideo = file.type.startsWith("video/");
    const newConf: IMainTrackConf = {
      item: {
        id: `main-${Date.now()}`,
        type: isVideo ? ("video" as const) : ("audio" as const),
        startTime: 0,
        endTime: duration,
        zIndex: 0,
        file,
      },
      asrData: asrDeleted() ? undefined : d.mainTrackConf.asrData,
    };
    setData({ ...d, mainTrackConf: newConf });
    setMainTrackDeleted(false);
    bumpVersion();
  };

  const handleDeleteMainTrack = () => {
    setMainTrackDeleted(true);
  };

  const handleDeleteAsr = () => {
    const d = data();
    if (!d) return;
    setData({
      ...d,
      mainTrackConf: { ...d.mainTrackConf, asrData: undefined },
    });
    setAsrDeleted(true);
    bumpVersion();
  };

  const handleImportAsr = (asrData: AsrData) => {
    const d = data();
    if (!d) return;
    setData({
      ...d,
      mainTrackConf: { ...d.mainTrackConf, asrData },
    });
    setAsrDeleted(false);
    bumpVersion();
  };

  const handleDeleteItem = (id: string) => {
    const d = data();
    if (!d) return;
    setData({ ...d, items: d.items.filter((it) => it.id !== id) });
  };

  const handleImportItems = async (files: File[]) => {
    const d = data();
    if (!d) return;
    const maxZ = d.items.reduce((max, it) => Math.max(max, it.zIndex), 0);
    const newItems: Item[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const duration = await getMediaDuration(file);
      let type: "video" | "audio" | "image";
      if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";
      else if (file.type.startsWith("image/")) type = "image";
      else continue;
      newItems.push({
        id: crypto.randomUUID(),
        type,
        startTime: 0,
        endTime: duration,
        zIndex: maxZ + i + 1,
        file,
      } as Item);
    }
    setData({ ...d, items: [...d.items, ...newItems] });
  };

  const handleExport = async () => {
    const d = data();
    if (!d || exporting() || mainTrackDeleted()) return;
    setExporting(true);
    try {
      const item = d.mainTrackConf.item;
      const overlayAudioItems = d.items.filter(
        (it): it is typeof it & { type: "audio"; file: File } =>
          it.type === "audio" && "file" in it,
      );
      await exportVideo(
        item.file,
        deletedRanges(),
        item.endTime - item.startTime,
        overlayAudioItems,
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportClips = async () => {
    const d = data();
    if (!d || exportingClips() || clips().length === 0) return;
    setExportingClips(true);
    try {
      await exportClips(d.mainTrackConf.item.file, clips());
    } finally {
      setExportingClips(false);
    }
  };

  const selectionMenuItems: SelectionMenuItem[] = [
    {
      icon: () => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="w-4 h-4"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
            clip-rule="evenodd"
          />
        </svg>
      ),
      label: "添加片段",
      onClick: (selection) => {
        setClips((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            start: selection.start,
            end: selection.end,
          },
        ]);
      },
    },
  ];

  const handleDragStart = (index: number, e: DragEvent) => {
    setDragIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number, e: DragEvent) => {
    e.preventDefault();
    const from = dragIndex();
    if (from === null || from === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setClips((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(targetIndex > from ? targetIndex - 1 : targetIndex, 0, moved);
      return arr;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div class="min-w-[1400px] max-w-[1400px] mx-auto p-4">
      <section>
        <h1 class="text-xl font-bold mb-4">Basic</h1>

        <div class="mb-4 flex items-center gap-3">
          <div class="flex items-center gap-1">
            <button
              class="w-4 h-4 flex items-center justify-center rounded-full border border-gray-700 text-gray-700 hover:bg-gray-100"
              onClick={() => setPps(Math.max(5, Math.round(pps() * 0.8)))}
            >
              <svg
                viewBox="0 0 16 16"
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="4" y1="8" x2="12" y2="8" />
              </svg>
            </button>
            <input
              type="range"
              min="5"
              max="600"
              value={pps()}
              onInput={(e) => setPps(Number(e.currentTarget.value))}
              class="w-30 h-1 appearance-auto accent-black cursor-pointer"
            />
            <button
              class="w-4 h-4 flex items-center justify-center rounded-full border border-gray-700 text-gray-700 hover:bg-gray-100"
              onClick={() => setPps(Math.min(600, Math.round(pps() * 1.2)))}
            >
              <svg
                viewBox="0 0 16 16"
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="8" y1="4" x2="8" y2="12" />
                <line x1="4" y1="8" x2="12" y2="8" />
              </svg>
            </button>
          </div>
          <label class="text-sm text-black flex items-center gap-1">
            <input
              type="checkbox"
              checked={showAsrTrack()}
              onChange={(e) => setShowAsrTrack(e.currentTarget.checked)}
              class="accent-black"
            />
            ASR 文字轨
          </label>
          <label class="text-sm text-black flex items-center gap-1">
            <input
              type="checkbox"
              checked={showMediaTracks()}
              onChange={(e) => setShowMediaTracks(e.currentTarget.checked)}
              class="accent-black"
            />
            媒体轨
          </label>
          <div class="ml-4">
            <button
              class="px-3 py-1 text-sm bg-white text-black border border-gray-300 rounded hover:bg-gray-50"
              onClick={() => setShowAssetsModal(true)}
            >
              素材管理
            </button>
          </div>
          <div>
            <button
              class="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExport}
              disabled={exporting() || !data() || mainTrackDeleted()}
            >
              {exporting() ? "导出中..." : "导出裁剪"}
            </button>
          </div>
        </div>

        {loading() && (
          <div class="text-gray-500 text-sm py-8 text-center">
            Loading demo data...
          </div>
        )}

        {data() && (
          <div class="flex gap-4 items-start">
            <div class="w-[800px] px-1 border border-gray-300 rounded bg-white flex-shrink-0">
              <Show
                when={!mainTrackDeleted()}
                fallback={
                  <div class="py-12 text-center text-gray-400 text-sm">
                    主轨素材已移除
                  </div>
                }
              >
                <Show when={showTimeline()}>
                  <Timeline
                    initData={data()!}
                    pixelsPerSecond={pps()}
                    currentTime={currentTime()}
                    onSeek={(time) => setCurrentTime(time)}
                    onChange={(arg) => {
                      console.log("onChange", arg);
                      setDeletedRanges(arg.deletedRanges ?? []);
                      if (arg.items) {
                        setData((d) => (d ? { ...d, items: arg.items! } : d));
                      }
                    }}
                    showAsrTrack={showAsrTrack()}
                      showMediaTracks={showMediaTracks()}
                      selectionMenuItems={selectionMenuItems}
                    />
                </Show>
              </Show>
            </div>

            <div class="flex-1 min-w-0 sticky top-4 max-h-screen overflow-y-auto">
              <Show
                when={!mainTrackDeleted()}
                fallback={
                  <div class="w-full rounded border border-gray-300 bg-gray-50 py-8 text-center text-gray-400 text-sm">
                    主轨素材已移除
                  </div>
                }
              >
                <PreviewPlayer
                  mainTrackConf={data()!.mainTrackConf}
                  currentTime={currentTime()}
                  isPlaying={isPlaying()}
                  deletedRanges={deletedRanges()}
                  items={data()!.items}
                  onTimeUpdate={setCurrentTime}
                  onPlayPause={setIsPlaying}
                  onSeek={setCurrentTime}
                />
              </Show>

              <div class="mt-4 border border-gray-300 rounded bg-white p-3">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-gray-800">摘录片段</h3>
                  <Show when={clips().length > 0}>
                    <button
                      class="px-2 py-0.5 text-xs bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleExportClips}
                      disabled={exportingClips()}
                    >
                      {exportingClips() ? "导出中..." : "导出片段"}
                    </button>
                  </Show>
                </div>

                <Show
                  when={clips().length > 0}
                  fallback={
                    <div class="text-xs text-gray-400 py-4 text-center">
                      在时间轴上选择区间，点击 + 按钮添加片段
                    </div>
                  }
                >
                  <div class="flex flex-col gap-1">
                    <For each={clips()}>
                      {(clip, index) => (
                        <div
                          class={`flex items-center gap-2 px-2 py-1.5 rounded border text-sm cursor-pointer hover:bg-gray-50 select-none ${
                            dragOverIndex() === index()
                              ? "border-black"
                              : "border-gray-200"
                          }`}
                          onClick={() => setCurrentTime(clip.start)}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(index(), e)}
                          onDragOver={(e) => handleDragOver(index(), e)}
                          onDrop={(e) => handleDrop(index(), e)}
                          onDragEnd={handleDragEnd}
                        >
                          <span class="text-gray-300 cursor-grab text-xs">
                            ⠿
                          </span>
                          <span class="text-gray-400 text-xs w-4 text-center">
                            {index() + 1}
                          </span>
                          <span class="text-gray-700 text-xs flex-1">
                            {formatTime(clip.start)} - {formatTime(clip.end)}
                          </span>
                          <button
                            class="text-gray-300 hover:text-red-500 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClips((prev) =>
                                prev.filter((c) => c.id !== clip.id),
                              );
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        )}

        <div class="mt-4 text-xs text-gray-500">
          <p>
            拖拽覆盖素材可移动位置 | 在空白区域拖拽可创建删除区间 |
            悬停删除区间可移除 | 点击时间轴跳转播放位置
          </p>
        </div>
      </section>

      <Show when={showAssetsModal() && data()}>
        <AssetManagerModal
          data={data()!}
          mainTrackDeleted={mainTrackDeleted()}
          asrDeleted={asrDeleted()}
          onReplaceMainTrack={handleReplaceMainTrack}
          onDeleteMainTrack={handleDeleteMainTrack}
          onDeleteAsr={handleDeleteAsr}
          onImportAsr={handleImportAsr}
          onDeleteItem={handleDeleteItem}
          onImportItems={handleImportItems}
          onClose={() => setShowAssetsModal(false)}
        />
      </Show>
    </div>
  );
};

export default App;
