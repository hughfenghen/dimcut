
## 日志

### 添加素材日志

```
[Timeline] <For> 渲染函数执行 row: 0 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 1 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 2 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 3 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 4 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
...
[Timeline] <For> 渲染函数执行 row: 28 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:42 [Timeline] initData.items effect 触发 外部items数量: 1 堆栈:     at http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:27:97
    at http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:428:32
    at untrack (http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:409:10)
Timeline.tsx:52 [Timeline] setItems 执行 removed: 0 added: 1
Timeline.tsx:120 [Timeline] mainTrackConf.item effect 触发 item.id: main-video item.type: video item引用是否变化: false
Timeline.tsx:147 [Timeline] mainTrackConf.item waveform effect 触发 item.id: main-video
29VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
Timeline.tsx:170 [Timeline] items effect 触发 (overlay waveform) items数量: 1
waveform-extractor.ts:26 Timer '[Waveform] init total' already exists
（匿名） @ waveform-extractor.ts:26
（匿名） @ waveform-extractor.ts:21
（匿名） @ Timeline.tsx:181
（匿名） @ solid-js.js?v=89b164ae:428
untrack @ solid-js.js?v=89b164ae:409
（匿名） @ solid-js.js?v=89b164ae:428
runComputation @ solid-js.js?v=89b164ae:665
updateComputation @ solid-js.js?v=89b164ae:650
runTop @ solid-js.js?v=89b164ae:756
runUserEffects @ solid-js.js?v=89b164ae:867
（匿名） @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:773
completeUpdates @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:774
completeUpdates @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:774
writeSignal @ solid-js.js?v=89b164ae:625
setter @ solid-js.js?v=89b164ae:189
（匿名） @ App.tsx:200
await in （匿名）
（匿名） @ AssetManagerModal.tsx:64
VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: undefined isVisible: false 引用变化: true
VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: undefined isVisible: false 引用变化: true
VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: undefined isVisible: false 引用变化: true
VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: undefined isVisible: false 引用变化: true
...
[VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: undefined isVisible: false 引用变化: true
waveform-extractor.ts:44 Timer '[Waveform] decode + buildRawPeaks' already exists
（匿名） @ waveform-extractor.ts:44
await in （匿名）
（匿名） @ waveform-extractor.ts:21
（匿名） @ Timeline.tsx:153
（匿名） @ solid-js.js?v=89b164ae:428
untrack @ solid-js.js?v=89b164ae:409
（匿名） @ solid-js.js?v=89b164ae:428
runComputation @ solid-js.js?v=89b164ae:665
updateComputation @ solid-js.js?v=89b164ae:650
runTop @ solid-js.js?v=89b164ae:756
runUserEffects @ solid-js.js?v=89b164ae:867
（匿名） @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:773
completeUpdates @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:774
writeSignal @ solid-js.js?v=89b164ae:625
setter @ solid-js.js?v=89b164ae:189
（匿名） @ App.tsx:200
await in （匿名）
（匿名） @ AssetManagerModal.tsx:64
16VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: true hasDrawn: false lastDrawnPps: 0
waveform-extractor.ts:46 [Waveform] decode + buildRawPeaks: 72.95703125 ms
waveform-extractor.ts:48 [Waveform] init total: 109.85791015625 ms
16VideoTrackItem.tsx:39 [VideoTrackItem] drawThumbnails 调用 hasDrawn: false lastDrawnPps: 0 pps: 80
waveform-extractor.ts:46 Timer '[Waveform] decode + buildRawPeaks' does not exist
（匿名） @ waveform-extractor.ts:46
waveform-extractor.ts:48 Timer '[Waveform] init total' does not exist
（匿名） @ waveform-extractor.ts:48
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
16VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: true 引用变化: true
12VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
3VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: true lastDrawnPps: 80
```

### 移动素材日志

```
[Timeline] items effect 触发 (overlay waveform) items数量: 1
Timeline.tsx:65 [Timeline] emitChange 调用 items数量: 1 堆栈:     at emitChange (http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:39:80)
    at onMove (http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:178:4)
App.tsx:409 [App] Timeline onChange 回调 items数量: 1 mainTrackConf引用是否变化: false
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 0 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 1 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 2 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
...
[Timeline] <For> 渲染函数执行 row: 28 extractor: ThumbnailExtractor waveformExt: WaveformExtractor mainSlice: exists
Timeline.tsx:42 [Timeline] initData.items effect 触发 外部items数量: 1 堆栈:     at http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:27:97
    at http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:428:32
    at untrack (http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:409:10)
Timeline.tsx:120 [Timeline] mainTrackConf.item effect 触发 item.id: main-video item.type: video item引用是否变化: false
Timeline.tsx:147 [Timeline] mainTrackConf.item waveform effect 触发 item.id: main-video
29VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
Timeline.tsx:170 [Timeline] items effect 触发 (overlay waveform) items数量: 1
Timeline.tsx:65 [Timeline] emitChange 调用 items数量: 1 堆栈:     at emitChange (http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:39:80)
    at onMove (http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:178:4)
App.tsx:409 [App] Timeline onChange 回调 items数量: 1 mainTrackConf引用是否变化: false
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 0 extractor: undefined waveformExt: undefined mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 1 extractor: undefined waveformExt: undefined mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 2 extractor: undefined waveformExt: undefined mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 3 extractor: undefined waveformExt: undefined mainSlice: exists
...
[Timeline] <For> 渲染函数执行 row: 28 extractor: undefined waveformExt: undefined mainSlice: exists
Timeline.tsx:42 [Timeline] initData.items effect 触发 外部items数量: 1 堆栈:     at http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:27:97
    at http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:428:32
    at untrack (http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:409:10)
Timeline.tsx:120 [Timeline] mainTrackConf.item effect 触发 item.id: main-video item.type: video item引用是否变化: false
Timeline.tsx:147 [Timeline] mainTrackConf.item waveform effect 触发 item.id: main-video
waveform-extractor.ts:26 Timer '[Waveform] init total' already exists
（匿名） @ waveform-extractor.ts:26
（匿名） @ waveform-extractor.ts:21
（匿名） @ Timeline.tsx:153
（匿名） @ solid-js.js?v=89b164ae:428
untrack @ solid-js.js?v=89b164ae:409
（匿名） @ solid-js.js?v=89b164ae:428
runComputation @ solid-js.js?v=89b164ae:665
updateComputation @ solid-js.js?v=89b164ae:650
runTop @ solid-js.js?v=89b164ae:756
runUserEffects @ solid-js.js?v=89b164ae:867
（匿名） @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:773
completeUpdates @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:774
writeSignal @ solid-js.js?v=89b164ae:625
setter @ solid-js.js?v=89b164ae:189
（匿名） @ App.tsx:412
（匿名） @ Timeline.tsx:66
（匿名） @ Timeline.tsx:250
Timeline.tsx:170 [Timeline] items effect 触发 (overlay waveform) items数量: 1
Timeline.tsx:65 [Timeline] emitChange 调用 items数量: 1 堆栈:     at emitChange (http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:39:80)
    at onMove (http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:178:4)
App.tsx:409 [App] Timeline onChange 回调 items数量: 1 mainTrackConf引用是否变化: false
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 0 extractor: undefined waveformExt: undefined mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 1 extractor: undefined waveformExt: undefined mainSlice: exists
Timeline.tsx:537 [Timeline] <For> 渲染函数执行 row: 2 extractor: undefined waveformExt: undefined mainSlice: exists
...
[Timeline] <For> 渲染函数执行 row: 28 extractor: undefined waveformExt: undefined mainSlice: exists
Timeline.tsx:42 [Timeline] initData.items effect 触发 外部items数量: 1 堆栈:     at http://localhost:5173/src/lib/Timeline.tsx?t=1778337090021:27:97
    at http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:428:32
    at untrack (http://localhost:5173/node_modules/.vite/deps/solid-js.js?v=89b164ae:409:10)
Timeline.tsx:120 [Timeline] mainTrackConf.item effect 触发 item.id: main-video item.type: video item引用是否变化: false
Timeline.tsx:147 [Timeline] mainTrackConf.item waveform effect 触发 item.id: main-video
waveform-extractor.ts:26 Timer '[Waveform] init total' already exists
（匿名） @ waveform-extractor.ts:26
（匿名） @ waveform-extractor.ts:21
（匿名） @ Timeline.tsx:153
（匿名） @ solid-js.js?v=89b164ae:428
untrack @ solid-js.js?v=89b164ae:409
（匿名） @ solid-js.js?v=89b164ae:428
runComputation @ solid-js.js?v=89b164ae:665
updateComputation @ solid-js.js?v=89b164ae:650
runTop @ solid-js.js?v=89b164ae:756
runUserEffects @ solid-js.js?v=89b164ae:867
（匿名） @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:773
completeUpdates @ solid-js.js?v=89b164ae:823
runUpdates @ solid-js.js?v=89b164ae:774
writeSignal @ solid-js.js?v=89b164ae:625
setter @ solid-js.js?v=89b164ae:189
（匿名） @ App.tsx:412
（匿名） @ Timeline.tsx:66
（匿名） @ Timeline.tsx:250
VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: undefined isVisible: false 引用变化: true
VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: undefined isVisible: false 引用变化: true
VideoTrackItem.tsx:125 [VideoTrackItem] pps/visibility effect 触发 pps: 80 isVisible: false hasDrawn: false lastDrawnPps: 0
...
waveform-extractor.ts:46 Timer '[Waveform] decode + buildRawPeaks' does not exist
waveform-extractor.ts:48 Timer '[Waveform] init total' does not exist
7
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
13
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: true 引用变化: true
9
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
waveform-extractor.ts:46 Timer '[Waveform] decode + buildRawPeaks' does not exist
waveform-extractor.ts:48 Timer '[Waveform] init total' does not exist
8
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
13
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: true 引用变化: true
8
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
waveform-extractor.ts:46 Timer '[Waveform] decode + buildRawPeaks' does not exist
waveform-extractor.ts:48 Timer '[Waveform] init total' does not exist
9
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
13
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: true 引用变化: true
7
VideoTrackItem.tsx:140 [VideoTrackItem] waveformExtractor effect 触发 hasAudio: true isVisible: false 引用变化: true
```
