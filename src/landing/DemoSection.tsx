import { type Component } from "solid-js";
import App from "../demo/App.tsx";

export const DemoSection: Component = () => {
  return (
    <section
      id="demo"
      class="relative bg-[--color-bg-demo] py-28"
    >
      <div class="mx-auto max-w-[1200px] px-8">
        <header class="mb-12 max-w-[760px]">
          <p class="mb-4 font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[--color-fg-faint]">
            IV. · Live demo · 在线体验
          </p>
          <h2 class="font-serif text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-[1.25] text-[--color-fg]">
            Try it on a real video.{" "}
            <em class="italic text-[--color-accent]">Right here.</em>
          </h2>
          <p class="mt-4 font-sans text-[0.95rem] leading-[1.75] text-[--color-fg-dim]">
            All processing happens locally in your browser — nothing is uploaded.
            <br />
            所有视频/音频处理在本地浏览器完成，文件不会被上传至任何服务器。
          </p>
        </header>
      </div>

      {/* Demo card: full-width frame to allow internal 1400px scroll */}
      <div class="mx-auto max-w-[1400px] px-4">
        <div class="overflow-x-auto rounded-[12px] border border-[--color-hairline] bg-white py-6 shadow-[0_30px_60px_-30px_rgba(10,10,10,0.12)]">
          <App />
        </div>
      </div>
    </section>
  );
};
