import { type Component, createSignal, createResource } from "solid-js";
import { Timeline } from "../lib/index.ts";
import type { AsrData, IChangeEventData } from "../lib/types.ts";

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
      resolve(30); // fallback
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  });
}

const App: Component = () => {
  const [demoData] = createResource(loadDemoData);
  const [data, setData] = createSignal<IChangeEventData | undefined>();
  const [pps, setPps] = createSignal(80);

  // Sync resource into signal for onChange support
  const currentData = () => data() ?? demoData();

  return (
    <div class="max-w-4xl mx-auto p-4">
      <h1 class="text-xl font-bold mb-4">Open ZingAI - Timeline Demo</h1>

      <div class="mb-4 flex items-center gap-4">
        <label class="text-sm">
          Pixels per second: {pps()}
        </label>
        <input
          type="range"
          min="20"
          max="200"
          value={pps()}
          onInput={(e) => setPps(Number(e.currentTarget.value))}
          class="w-48"
        />
      </div>

      {demoData.loading && (
        <div class="text-gray-500 text-sm py-8 text-center">Loading demo data...</div>
      )}

      {currentData() && (
        <div class="border border-gray-300 rounded bg-white">
          <Timeline
            data={currentData()!}
            pixelsPerSecond={pps()}
            onChange={setData}
          />
        </div>
      )}

      <div class="mt-4 text-xs text-gray-500">
        <p>拖拽覆盖素材可移动位置 | 在空白区域拖拽可创建删除区间 | 悬停删除区间可移除</p>
      </div>
    </div>
  );
};

export default App;
