# DimCut 技术概览

DimCut 是一个基于 SolidJS 的**视频时间轴编辑器组件库**，以 NPM 包形式发布。它提供了多行折行时间轴、ASR 语音识别文字轨、区间删除编辑、预览播放和视频导出等能力。

---

## 技术栈

| 类别       | 技术                                     |
| ---------- | ---------------------------------------- |
| UI 框架    | SolidJS（细粒度响应式）                  |
| 样式       | TailwindCSS v4                           |
| 语言       | TypeScript                               |
| 多媒体处理 | mediabunny（视频解码/音频解码/编码导出） |
| 构建       | Vite（Library Mode）                     |
| 测试       | Vitest                                   |
| 包管理     | pnpm                                     |

---

## 目录结构

```
src/
├── index.css                    # Tailwind 入口
├── index.tsx                    # 应用入口
├── demo/                        # Demo 应用（使用示例）
│   ├── App.tsx                  # 主应用：Timeline + PreviewPlayer + 导出
│   └── mock-data.ts             # 静态模拟数据
└── lib/                         # 组件库源码（公共 API）
    ├── index.ts                 # 桶文件，统一导出
    ├── types.ts                 # 核心类型定义
    ├── constants.ts             # 常量配置
    ├── time-utils.ts            # 时间/像素转换工具
    ├── asr-utils.ts             # ASR 工具函数
    ├── layout.ts                # 时间轴布局引擎
    ├── waveform-extractor.ts    # 音频波形数据提取器
    ├── thumbnail-extractor.ts   # 视频缩略图提取器
    ├── video-exporter.ts        # 视频导出器
    ├── Timeline.tsx             # 时间轴主组件（核心）
    ├── TimelineRow.tsx           # 时间轴行组件
    ├── TrackItem.tsx             # 通用轨道片段
    ├── VideoTrackItem.tsx        # 视频轨道片段（缩略图+波形）
    ├── AudioTrackItem.tsx        # 音频轨道片段（波形）
    ├── AsrTrack.tsx              # ASR 文字轨道
    ├── DeletedRange.tsx          # 删除区间覆盖层
    ├── WaveformCanvas.tsx        # 波形 Canvas 绘制组件
    ├── PreviewPlayer.tsx         # 预览播放器
    └── __tests__/                # 单元测试
        ├── time-utils.test.ts
        ├── asr-utils.test.ts
        └── layout.test.ts
```

---

## 核心数据模型

### 类型层次

```
IItem (id, type, startTime, endTime, zIndex)
├── IMediaItem (+ file: File)
│   ├── IVideoItem  (type: "video")
│   ├── IAudioItem  (type: "audio")
│   └── IImageItem  (type: "image")
└── ITextItem (+ text: string)

Item = IVideoItem | IAudioItem | IImageItem | ITextItem
```

### 关键接口

- **`IMainTrackConf`** — 主轨道配置（item + 可选 asrData）
- **`DeletedRange`** — 已删除时间范围（start, end）
- **`IChangeEventData`** — 变更事件数据（items, mainTrackConf, deletedRanges）
- **`TimelineProps`** — Timeline 组件属性（initData, onChange, currentTime, onSeek, selectionMenuItems 等）
- **`RowLayout`** — 行布局信息（rowIndex, startTime, endTime）
- **`RowItemSlice`** — 片段在行内的可见切片（item, visibleStart, visibleEnd, subRow）

---

## 组件架构

```
App (demo)
├── Timeline (核心入口)
│   ├── ThumbnailExtractor / WaveformExtractor (媒体数据提取)
│   └── For each row:
│       └── TimelineRow
│           ├── AsrTrack ──── ASR 文本（文档流布局，支持文本选择）
│           ├── VideoTrackItem ── 视频缩略图 Canvas + 波形图
│           ├── AudioTrackItem ── 音频波形图
│           ├── TrackItem ── 通用片段（图片/文本等彩色矩形）
│           ├── DeletedRange ── 删除区间覆盖层
│           └── Selection overlay ── 框选覆盖层
│   └── Playhead (红色竖线，绝对定位)
│
└── PreviewPlayer (<video>/<audio> + 播放控制)
```

### 组件职责

| 组件               | 职责                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timeline**       | 核心编排组件。管理 items/deletedRanges 信号，ResizeObserver 监听容器宽度，计算行/层布局，管理 Extractor 生命周期，处理拖拽、框选、浮动菜单、Playhead |
| **TimelineRow**    | 渲染单行。计算内容高度（ASR + 主轨 + 叠加轨），分发鼠标事件，渲染时间标签                                                                            |
| **AsrTrack**       | 按段落/词渲染 ASR 文本。高亮已删除词（红色删除线）、当前播放词（灰色背景），ResizeObserver 报告高度                                                  |
| **VideoTrackItem** | IntersectionObserver 懒加载缩略图，ThumbnailExtractor 异步绘制到 Canvas，同时绘制波形，300ms 节流                                                    |
| **AudioTrackItem** | WaveformExtractor 提取波形，懒加载 + 节流                                                                                                            |
| **TrackItem**      | 通用彩色矩形片段，文本类型显示文字，支持拖拽                                                                                                         |
| **WaveformCanvas** | Canvas 2D 绘制居中镜像柱状波形图，HiDPI 适配，圆角 bar                                                                                               |
| **DeletedRange**   | 半透明红色覆盖层，右上角移除按钮，pointer-events 穿透                                                                                                |
| **PreviewPlayer**  | 管理 video/audio 元素，RAF 同步时间，自动跳过删除区间                                                                                                |

---

## 核心算法

### 1. 时间轴折行布局（layout.ts）

**行划分（computeRows）**：根据容器可用宽度和 `pixelsPerSecond` 计算每行可容纳的秒数，将总时长分为 N 行。

**片段分配（assignItemsToRows）**：将每个 Item 按时间范围分配到对应行，跨行 Item 被切割为多个 RowItemSlice。

**行内装箱（packItemsInRow）**：贪心算法 —— 先按 zIndex 分层，层内按 startTime 排序，非重叠片段放入同一 subRow，重叠片段放入新 subRow。

### 2. 删除区间合并（time-utils.ts）

排序后顺序遍历，重叠/相邻区间合并为一个大区间。

### 3. 波形数据提取（waveform-extractor.ts）

一次性解码全部音频，以 1000 peaks/秒密度缓存 rawPeaks（Float32Array）。查询时直接降采样 rawPeaks，无需重复解码。将 5 分钟视频的波形加载从 20 秒优化到毫秒级。

### 4. 缩略图提取（thumbnail-extractor.ts）

使用 mediabunny CanvasSink 批量提取视频帧，按 step 分组缓存。IntersectionObserver 仅提取可视区域内缩略图。

### 5. 视频导出（video-exporter.ts）

`computeValidSegments` 从总时长中减去删除区间得到有效片段。使用 mediabunny 的 VideoSampleSink/AudioSampleSink 逐帧读取，修正时间戳后通过 StreamTarget 流式写入文件，避免 OOM。

### 6. 播放跳过（PreviewPlayer.tsx）

每帧检查 currentTime 是否落入删除区间，若落入则跳转到 range.end。

---

## 状态管理

使用 SolidJS 内置响应式系统，无外部状态管理库。

**Timeline 内部信号**：items, deletedRanges, containerWidth, dragItemId, selectionStart/End, selectionSource 等

**派生计算（Memo）**：rows（行布局）, itemsByRow, mainSlicesByRow, layersByRow, selectionRange, menuPosition

**数据流方向**：props 向下传递，`onChange` 回调向上通知。Timeline 内部自主管理状态，`initData` 仅作为初始数据。

---

## 外部依赖

| 依赖            | 用途                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **solid-js**    | 响应式 UI 框架                                                                                                                      |
| **mediabunny**  | 多媒体处理：CanvasSink（缩略图）、AudioBufferSink（波形）、VideoSampleSink/AudioSampleSink（导出）、Output/StreamTarget（编码写入） |
| **tailwindcss** | 原子化 CSS                                                                                                                          |

### Web API 依赖

| API                    | 用途                  |
| ---------------------- | --------------------- |
| ResizeObserver         | 监听容器/轨道尺寸变化 |
| IntersectionObserver   | 缩略图/波形懒加载     |
| requestAnimationFrame  | 播放时间同步          |
| File System Access API | 导出保存对话框        |
| Canvas 2D API          | 缩略图和波形绘制      |
| window.getSelection    | ASR 文本选择监听      |

---

## 需求演进历史

| 阶段     | 需求          | 说明                                               |
| -------- | ------------- | -------------------------------------------------- |
| 基础架构 | 设计文档      | 类型定义、折行布局、轨道渲染、删除区间、拖拽交互   |
| 交互修复 | 拖拽/框选修复 | id 匹配、框选可视化、跨行拖拽、pointer-events 穿透 |
| 媒体渲染 | 视频缩略图    | mediabunny CanvasSink、ThumbnailExtractor、懒加载  |
| 媒体渲染 | 音频波形图    | AudioBufferSink、WaveformCanvas、bar 风格          |
| 状态修复 | 缩略图刷新    | initData 模式，Timeline 自主管理状态               |
| 播放集成 | 预览播放      | PreviewPlayer、Playhead 指示器、seek 交互          |
| ASR 集成 | 时间同步      | 词级高亮、点击跳转、行级性能优化                   |
| UI 美化  | 两轮优化      | 颜色/布局/Retina 适配/控件美化/轨道显隐            |
| ASR 重构 | 文档流布局    | 绝对定位 → 文档流、词级删除样式、选区互斥          |
| 性能优化 | 波形性能      | 一次性解码 + rawPeaks 缓存 + 降采样                |
| 导出功能 | 视频导出      | 有效片段计算、流式写入、时间戳修正                 |
| 播放增强 | 跳过删除      | 播放/seek 自动跳过已删除区间                       |
