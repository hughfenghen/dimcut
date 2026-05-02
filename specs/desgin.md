# 项目架构设计

## 流程状态

- 当前阶段：execute（全部完成）
- 最近动作：完成全部 15 个任务
- 更新时间：2026-05-02

## 背景 & 需求

./UI.png 是面向视频、播客编辑的创新型时间轴轨道交互；

图片内容描述：

1. 将横向一维时间线折断成多行；避免过多使用滚轮
2. 如果素材时间区间不冲突，不同类型素材也可以共享轨道；进一步增加信息密度
3. 文字轨（数据来自 ASR）优先，特别是泛知识类视频/播客音频，更方便检索定位
4. 红色白透明区域是被删除的区间

预计输入的 ASR 数据结构为：

```ts
interface AsrWord {
  word: string;
  start: number;
  end: number;
}

export interface AsrSegment {
  start: number;
  end: number;
  text: string;
  words: AsrWord[];
}

export interface AsrData {
  segments: AsrSegment[];
  language: string;
}
```

```ts
interface IItem {
  type: string;
  // 素材在轨道中的偏移
  startTime: number;
  endTime: number;
  zIndex: number;
}

interface IMediaItem extends IItem {
  file?: File;
}

interface IVideoItem extends IMediaItem {
  type: "video";
}

interface IAudioItem extends IMediaItem {
  type: "audio";
}

interface IImageItem extends IMediaItem {
  type: "image";
}

interface ITextItem extends IItem {
  type: "text";
  text: string;
}

interface IMainTrackConf {
  item: IVideoItem | IAudioItem;
  asrData?: AsrData;
}

// 组件接收到数据，和变更事件的数据结构
interface IChangeEventData {
  items: Item[];
  mainTrackConf: MainTrackConf;
  // 被删除的区间
  deletedRanges?: Array<{ start: number; end: number }>;
}
```

我需要一个可以发布到 NPM 仓库的 UI 组件：

- 技术栈：typescript + solid.js + tailwindcss + vitest(单元测试框架)
- 暂时与视频/音频的编辑功能解耦，仅实现时间轴的 UI 交互
- 时间轴中的对象绘制为矩形，暂时使用颜色区分不同类型
- 时间轴中可交互的对象称为 Item (可修改为更适合的名字)
  - 分为 视频、音频、图片、文字
  - 文字通过 text 存储字符串
  - Item 通过 zIndex 表示层级，越大绘制位置排在下层
    - 主轨道的视频、音频 zIndex = 0
  - Item 通过 startTime 表示在主轨道上的偏移量，通过拖拽变更 startTime 值
- 主轨道 MainTrackItem 可以是 VideoItem | AudioItem
  - 主轨道上的素材不允许拖拽改变位置
  - 如果主轨配置了 ASR 数据，则需要绘制文字轨，AsrWord 的时间控制文字位置

_当前目录是一个刚初始化完的模板项目，src 目录下的文件可丢弃_

## 现状分析

### 项目现状

- 使用 pnpm 管理的 Vite + Solid.js 模板项目
- 已安装依赖：solid-js, vite, vite-plugin-solid, typescript
- **缺少**：tailwindcss, vitest（需要安装）
- src/ 下是模板默认文件（App.tsx, index.tsx 等），可以丢弃重写
- 项目配置为 ES2023 + ESM，使用 bundler 模式
- 尚未配置 NPM 发布相关字段（main, exports, types 等）

### UI 设计分析（基于 UI.png）

从设计图可以观察到以下关键交互模式：

1. **折行时间轴**：整条时间线按固定宽度折成多行（类似文本换行），每行左侧标注起始时间（00:00, 00:10, 00:20）。每行约代表 10 秒时长
2. **层级结构**（从上到下，每行内）：
   - 第一层：ASR 文字轨 —— 每个单词独立显示，按时间位置排列（"this", "is", "transcript", "..."）
   - 第二层：视频帧预览条（深色影片帧缩略图）
   - 第三层：音频波形条（橙色竖线波形）
   - 额外层：其他素材（音频片段、SFX、Image 等）在不冲突时与主轨共享行空间
3. **删除区间**：红色半透明覆盖层标记被删除的时间段，跨越所有层级
4. **素材共享轨道**：在第二行（00:10）中，SFX 和 Image 素材直接放在主轨道下方、与主轨同行显示
5. **素材颜色区分**：音频素材=粉色，SFX=青色，Image=淡黄色

### 核心架构挑战

- 如何将连续时间轴折成多行，并维护时间→像素坐标的双向映射
- 同行内多层级素材的垂直排列与碰撞检测
- 删除区间的跨层级半透明覆盖渲染与 UI 交互创建/删除
- 拖拽交互中的时间吸附与边界约束
- 组件需要可独立发布为 NPM 包，需配置库模式构建

## 技术实现方案

### 1. 项目结构

```
src/
  lib/                     # 组件库核心代码（NPM 发布内容）
    types.ts               # 所有类型定义（Item, AsrData, MainTrackConf 等）
    Timeline.tsx           # 主组件入口
    TimelineRow.tsx        # 单行时间轴组件
    TrackItem.tsx          # 单个素材矩形组件
    AsrTrack.tsx           # ASR 文字轨组件（仅展示）
    DeletedRange.tsx       # 删除区间覆盖组件（含交互创建/删除）
    layout.ts              # 折行布局计算（时间→行分配、碰撞检测）
    time-utils.ts          # 时间→像素坐标转换工具
    constants.ts           # 颜色、默认值等常量
    index.ts               # 库导出入口
  demo/                    # 开发演示页面（不发布）
    App.tsx                # 演示入口
    mock-data.ts           # 模拟数据
  index.tsx                # Vite dev 入口（挂载 demo）
  index.css                # 全局样式 / Tailwind 入口
```

### 2. 缩放与折行模型

- 核心参数：`pixelsPerSecond`（1 秒 = n 像素），支持动态缩放
- 每行可展示的时间长度 = 容器可用宽度（containerWidth - 时间标签宽度） / pixelsPerSecond
- 总行数 = ceil(主轨道总时长 / 每行时间长度)
- 缩放时 `pixelsPerSecond` 变化 → 每行时长变化 → 行数自动调整
- 不再使用 `secondsPerRow` 作为固定配置

### 3. 核心数据流

- 组件接收 `IChangeEventData` 作为 props（包含 items、mainTrackConf、deletedRanges）
- 内部通过 `layout.ts` 计算折行布局：
  - 输入：主轨道时长、pixelsPerSecond、容器宽度
  - 输出：每行的时间范围 `{ rowIndex, startTime, endTime }`
- 将所有 Item 按时间范围分配到对应行
- 同一行内，按 zIndex 排列垂直层级；zIndex 相同且时间不冲突的素材可共享同一子层

### 4. 时间→像素映射

```
pixelX = (time - rowStartTime) * pixelsPerSecond
time = pixelX / pixelsPerSecond + rowStartTime
```

- `pixelsPerSecond`：缩放级别，可动态调整
- 行可用宽度 = containerWidth - timeLabelWidth

### 5. 折行布局算法（layout.ts）

- 根据主轨道总时长和容器宽度、pixelsPerSecond，计算总行数
- 每行生成一个 `RowLayout` 对象，包含该行的时间范围和分配到该行的 Items
- Item 跨行时需拆分渲染（一个 Item 在一行结束，在下一行继续）
- 同行内的 Item 按 zIndex 分组，同 zIndex 层内做时间碰撞检测，不冲突则合并到同一子行

### 6. 垂直层级排列

每行内的垂直结构（从上到下）：

1. ASR 文字轨（始终在最上方，仅展示文字，不支持交互）
2. 主轨道视频/音频（zIndex = 0，纯色矩形）
3. 覆盖素材按 zIndex 升序排列（zIndex >= 1）

同 zIndex 层内，时间不冲突的素材共享同一子行高度。

### 7. 组件 Props 设计

```ts
interface TimelineProps {
  data: IChangeEventData;
  pixelsPerSecond?: number;     // 缩放级别，默认 80
  onChange?: (data: IChangeEventData) => void;
}
```

### 8. 拖拽交互

- 非主轨道的 Item 支持水平拖拽，改变 `startTime`（endTime 随之移动，保持时长不变）
- 不支持拖拽边缘修改 startTime/endTime（即不支持裁剪）
- 拖拽约束：startTime >= 0，endTime <= 主轨道总时长
- 拖拽过程中实时更新位置预览，释放后触发 `onChange` 回调
- 主轨道素材锁定不可拖拽

### 9. 删除区间交互

- `deletedRanges` 中的每个区间渲染为红色半透明矩形覆盖层
- 覆盖层跨越该行内所有垂直层级
- 如果删除区间跨行，在每一行中分段渲染
- **创建删除区间**：用户在时间轴空白区域按住鼠标拖拽，选定时间范围后生成新的 deletedRange，触发 onChange
- **删除已有区间**：用户点击已有的删除区间，显示删除按钮或通过右键菜单移除该区间，触发 onChange

### 10. NPM 发布配置

- 使用 Vite library mode 构建
- 入口文件：`src/lib/index.ts`
- 输出格式：ES module
- 外部化 solid-js 依赖
- package.json 配置 exports、types、peerDependencies
- 包名：`open-zingai`

### 11. 素材渲染

- 所有素材暂时均渲染为纯色矩形，不使用 file 字段
- 颜色方案：
  - 视频：深灰/棕色（`#4A3728`）
  - 音频（主轨道）：橙色（`#E8A840`）
  - 音频（覆盖素材）：粉色（`#F0A0B0`）
  - 文字 ASR：黑色文字，无背景
  - 图片：淡黄色（`#F5E6C8`）
  - 删除区间：红色半透明（`rgba(255, 100, 100, 0.3)`）

## 待确认问题

- 暂无

## 任务清单

- [x] 任务1：安装 tailwindcss 和 vitest 依赖，配置 tailwind（postcss 插件 + tailwind.config）和 vitest（vitest.config.ts），验收点：`pnpm build` 和 `pnpm test` 命令可正常执行
- [x] 任务2：创建 `src/lib/types.ts`，定义所有类型接口（AsrWord, AsrSegment, AsrData, IItem, IMediaItem, IVideoItem, IAudioItem, IImageItem, ITextItem, IMainTrackConf, IChangeEventData, TimelineProps, RowLayout），验收点：TypeScript 编译无错误
- [x] 任务3：创建 `src/lib/constants.ts`，定义颜色映射表（按 Item type 映射颜色）和默认配置值（默认 pixelsPerSecond=80, timeLabelWidth=60），验收点：常量可被其他模块导入使用
- [x] 任务4：创建 `src/lib/time-utils.ts`，实现 `timeToPixel(time, rowStartTime, pixelsPerSecond)` 和 `pixelToTime(px, rowStartTime, pixelsPerSecond)` 两个纯函数，验收点：vitest 单元测试覆盖正向/逆向转换
- [x] 任务5：创建 `src/lib/layout.ts`，实现折行布局算法：`computeRows(totalDuration, containerWidth, timeLabelWidth, pixelsPerSecond)` 返回 RowLayout[]；`assignItemsToRows(items, rows)` 将 Item 分配到行并处理跨行拆分；`packItemsInRow(items)` 按 zIndex 分组并做同层碰撞检测合并子行，验收点：vitest 单元测试覆盖基本折行、跨行拆分、同层合并场景
- [x] 任务6：创建 `src/lib/TrackItem.tsx`，实现单个素材矩形组件，接收 Item 数据和位置信息（left, width），根据 type 渲染对应颜色矩形，文字类型额外显示 text 内容，验收点：组件可渲染四种类型的彩色矩形
- [x] 任务7：创建 `src/lib/AsrTrack.tsx`，实现 ASR 文字轨组件，接收 AsrData 和行时间范围，按 AsrWord 时间位置渲染每个单词文字（仅展示，无交互），验收点：文字按时间位置正确排列
- [x] 任务8：创建 `src/lib/DeletedRange.tsx`，实现删除区间覆盖组件，渲染红色半透明矩形；支持点击已有区间显示删除按钮移除该区间，验收点：区间正确渲染且可被点击删除
- [x] 任务9：创建 `src/lib/TimelineRow.tsx`，组合单行时间轴：左侧时间标签 + ASR 文字轨 + 主轨道矩形 + 覆盖素材 + 删除区间覆盖层；处理行内垂直布局（按 zIndex 分层），验收点：单行可正确渲染所有层级内容
- [x] 任务10：创建 `src/lib/Timeline.tsx`，实现主组件：接收 TimelineProps，使用 layout.ts 计算折行，渲染多个 TimelineRow；实现拖拽交互（mousedown/mousemove/mouseup 改变 Item startTime）；实现删除区间创建交互（空白区域拖拽选区）；缩放参数 pixelsPerSecond 支持外部控制，验收点：组件可渲染完整的折行时间轴并响应拖拽和删除区间操作
- [x] 任务11：创建 `src/lib/index.ts`，导出 Timeline 组件和所有公开类型，验收点：`import { Timeline } from './lib'` 可用
- [x] 任务12：创建 `src/demo/mock-data.ts`，构造包含主轨道视频（30s）+ ASR 数据（多个 segment/word）+ 多个覆盖素材（音频、图片）+ 删除区间的模拟数据，验收点：数据结构符合类型定义
- [x] 任务13：创建 `src/demo/App.tsx` 和更新 `src/index.tsx`、`src/index.css`，搭建开发演示页面，引入 Timeline 组件传入 mock 数据，包含 pixelsPerSecond 缩放滑块控件，验收点：`pnpm dev` 可在浏览器中查看完整时间轴演示
- [x] 任务14：配置 Vite library mode 构建（vite.config.ts 添加 build.lib 配置，入口 src/lib/index.ts，格式 es，外部化 solid-js）；更新 package.json 添加 exports、types、peerDependencies 字段，包名 `open-zingai`，验收点：`pnpm build` 输出 dist/ 目录包含 es 模块和类型声明
- [x] 任务15：为 layout.ts 和 time-utils.ts 编写完整的 vitest 单元测试文件（`src/lib/__tests__/layout.test.ts` 和 `time-utils.test.ts`），验收点：`pnpm test` 全部通过

## 执行记录

- 任务1完成：安装 tailwindcss@4.2.4, @tailwindcss/vite@4.2.4, vitest@4.1.5, jsdom@29.1.1；创建 vitest.config.ts；更新 vite.config.ts 添加 tailwindcss 插件；package.json 添加 test/test:watch 脚本。验证：vitest 可执行
- 任务2完成：创建 src/lib/types.ts，定义全部类型接口（含 Item 联合类型、RowLayout、RowItemSlice、RowData 等）
- 任务3完成：创建 src/lib/constants.ts，定义颜色映射和默认配置值
- 任务4完成：创建 src/lib/time-utils.ts，实现 timeToPixel/pixelToTime/formatTime
- 任务5完成：创建 src/lib/layout.ts，实现 computeRows/assignItemsToRows/packItemsInRow
- 任务6完成：创建 src/lib/TrackItem.tsx，支持四种类型彩色矩形渲染
- 任务7完成：创建 src/lib/AsrTrack.tsx，按 AsrWord 时间位置渲染文字
- 任务8完成：创建 src/lib/DeletedRange.tsx，红色半透明矩形 + hover 删除按钮
- 任务9完成：创建 src/lib/TimelineRow.tsx，组合 ASR 文字轨 + 主轨道 + 覆盖素材 + 删除区间
- 任务10完成：创建 src/lib/Timeline.tsx，主组件含拖拽交互和删除区间创建
- 任务11完成：创建 src/lib/index.ts 导出入口
- 任务12完成：创建 src/demo/mock-data.ts 模拟数据（30s 视频 + ASR + 覆盖素材 + 删除区间）
- 任务13完成：创建 src/demo/App.tsx 演示页面，含 pixelsPerSecond 缩放滑块；更新 index.tsx/index.css；删除模板文件
- 任务14完成：配置 Vite library mode（入口 src/lib/index.ts，ES 格式，外部化 solid-js）；更新 package.json 添加 exports/types/peerDependencies/files。验证：`pnpm build` 输出 dist/index.js (11.09 kB)
- 任务15完成：编写 time-utils.test.ts 和 layout.test.ts。验证：`pnpm test` 全部 20 个测试通过
