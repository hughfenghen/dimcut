import { type Component, createSignal } from "solid-js";
import { Timeline } from "../lib/index.ts";
import type { IChangeEventData } from "../lib/types.ts";
import { mockData } from "./mock-data.ts";

const App: Component = () => {
  const [data, setData] = createSignal<IChangeEventData>(mockData);
  const [pps, setPps] = createSignal(80);

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

      <div class="border border-gray-300 rounded bg-white">
        <Timeline
          data={data()}
          pixelsPerSecond={pps()}
          onChange={setData}
        />
      </div>

      <div class="mt-4 text-xs text-gray-500">
        <p>拖拽覆盖素材可移动位置 | 在空白区域拖拽可创建删除区间 | 悬停删除区间可移除</p>
      </div>
    </div>
  );
};

export default App;
