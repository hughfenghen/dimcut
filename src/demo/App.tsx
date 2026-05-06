import { type Component, createSignal, createResource } from "solid-js";
import { Timeline } from "../lib/index.ts";
import { PreviewPlayer } from "../lib/PreviewPlayer.tsx";
import { exportVideo } from "../lib/video-exporter.ts";
import type { AsrData, DeletedRange, IChangeEventData } from "../lib/types.ts";

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

  // Get video duration
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
    items: [
      {
        id: "xxx",
        type: "audio",
        startTime: 0,
        endTime: 10,
        zIndex: 1,
      },
    ],
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
      resolve(30); // fallback
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  });
}

const App: Component = () => {
  const [demoData] = createResource(loadDemoData);
  const [pps, setPps] = createSignal(80);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [showAsrTrack, setShowAsrTrack] = createSignal(true);
  const [showMediaTracks, setShowMediaTracks] = createSignal(true);
  const [deletedRanges, setDeletedRanges] = createSignal<DeletedRange[]>([]);
  const [exporting, setExporting] = createSignal(false);

  const handleExport = async () => {
    const data = demoData();
    if (!data || exporting()) return;
    setExporting(true);
    try {
      const item = data.mainTrackConf.item;
      await exportVideo(
        item.file,
        deletedRanges(),
        item.endTime - item.startTime,
      );
    } finally {
      setExporting(false);
    }
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
              class="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExport}
              disabled={exporting() || !demoData()}
            >
              {exporting() ? "导出中..." : "导出"}
            </button>
          </div>
        </div>

        {demoData.loading && (
          <div class="text-gray-500 text-sm py-8 text-center">
            Loading demo data...
          </div>
        )}

        {demoData() && (
          <div class="flex gap-4 items-start">
            {/* Left: Timeline */}
            <div class="w-[800px] px-1 border border-gray-300 rounded bg-white flex-shrink-0">
              <Timeline
                initData={demoData()!}
                pixelsPerSecond={pps()}
                currentTime={currentTime()}
                onSeek={(time) => setCurrentTime(time)}
                onChange={(arg) => {
                  console.log("onChange", arg);
                  setDeletedRanges(arg.deletedRanges ?? []);
                }}
                showAsrTrack={showAsrTrack()}
                showMediaTracks={showMediaTracks()}
              />
            </div>

            {/* Right: Preview Player */}
            <PreviewPlayer
              mainTrackConf={demoData()!.mainTrackConf}
              currentTime={currentTime()}
              isPlaying={isPlaying()}
              deletedRanges={deletedRanges()}
              onTimeUpdate={setCurrentTime}
              onPlayPause={setIsPlaying}
              onSeek={setCurrentTime}
            />
          </div>
        )}

        <div class="mt-4 text-xs text-gray-500">
          <p>
            拖拽覆盖素材可移动位置 | 在空白区域拖拽可创建删除区间 |
            悬停删除区间可移除 | 点击时间轴跳转播放位置
          </p>
        </div>
      </section>
    </div>
  );
};

export default App;
