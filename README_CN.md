# DimCut

**[English](./README.md) ｜ 中文**

DimCut 是一个新型的剪辑交互设计，将一维时间轴折叠成多行，同时整合文字、声音、画面，多维信息；

我相信高密度信息能改进剪辑体验与效率，特别是剪辑知识类视频，如演讲、访谈、播客等。

DimCut 是基于 Web 技术构建，所有处理均在本地浏览器完成，文件不会被上传至任何服务器。

**[在线体验 →](https://fenghen.me/dimcut/)**

---

## 特性

- **二维多行时间轴** — 一维时间轴折叠成多行，一屏纵览全局，告别反复平移与缩放。
- **ASR 文字轨** — 语音转写文字与媒体对齐。复制、删除、重排文字，等同于编辑视频。
- **文字驱动剪辑** — 当内容以语言为核心时（讲座、访谈、播客），用文字驱动剪辑是最高效的方式。
- **视频缩略图** — 通过 mediabunny CanvasSink 提取，IntersectionObserver 懒加载。
- **音频波形图** — 一次性解码并缓存原始峰值数据，HiDPI 柱状波形 Canvas 渲染。
- **预览播放** — 内置播放器，播放头同步，自动跳过已删除区间。
- **视频导出** — 裁剪或导出片段，流式写入避免内存溢出，全程浏览器内完成。
- **离线网页应用** — 无服务器、无上传、无需账号，一切在浏览器中运行。

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/hughfenghen/dimcut.git
cd dimcut

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开 `http://localhost:5173` 查看官网和交互式演示。

## 许可证

[LGPLv3](./LICENSE)

## 链接

- [在线演示](https://fenghen.me/dimcut/)
- [作者 — 风痕](https://fenghen.me)
