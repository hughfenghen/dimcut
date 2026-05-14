# DimCut

**English ｜ [中文](./README_CN.md)**

DimCut is a novel editing interaction design that folds the 1D timeline into multiple rows, integrating text, audio, and visuals — multidimensional information at a glance.

I believe high-density information improves the editing experience and efficiency, especially for knowledge-based videos such as talks, interviews, podcasts, and more.

DimCut is built on web technologies. All processing happens locally in the browser — your files are never uploaded to any server.

**[Try the live demo →](https://hughfenghen.github.io/dimcut/)**

---

## Features

- **2D Multi-row Timeline** — The 1D timeline is folded into rows, giving you a full overview on one screen. No more endless panning and zooming.
- **ASR Text Track** — Speech transcripts are aligned alongside media. Copy, delete, or reorder text — that equals editing the video.
- **Text-first Editing** — When content is driven by speech (lectures, interviews, podcasts), text-first editing is simply the fastest way.
- **Video Thumbnails** — Extracted via mediabunny CanvasSink, lazily loaded with IntersectionObserver.
- **Audio Waveforms** — Decoded once and cached as raw peaks, rendered as HiDPI bar-style waveform on Canvas.
- **Preview Playback** — Built-in player with playhead sync and automatic skip over deleted ranges.
- **Video Export** — Trim or export clips with streaming writes to avoid OOM. All done in-browser.
- **Offline Web App** — No server, no upload, no account. Everything runs in your browser.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/hughfenghen/dimcut.git
cd dimcut

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open `http://localhost:5173` to see the landing page and interactive demo.

## License

[LGPLv3](./LICENSE)

## Links

- [Live Demo](https://hughfenghen.github.io/dimcut/)
- [Author — Fenghen](https://fenghen.me)
