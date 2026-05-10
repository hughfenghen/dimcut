import { type Component } from "solid-js";
import { TimelineIllustration } from "./TimelineIllustration.tsx";

export const Hero: Component = () => {
  return (
    <section
      id="top"
      class="relative flex min-h-screen items-center pt-28 pb-20"
    >
      {/* faint corner mark */}
      <span class="pointer-events-none absolute left-8 top-24 font-serif text-[0.7rem] tracking-[0.4em] text-[--color-fg-faint]">
        I.
      </span>

      <div class="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-8 lg:grid-cols-12">
        {/* Left: copy */}
        <div class="lg:col-span-7">
          <p class="mb-8 font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[--color-fg-faint]">
            A text-first video timeline · 文本优先的视频时间轴
          </p>

          <h1 class="font-serif text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-[--color-fg]">
            Edit your timeline
            <br />
            like reading a{" "}
            <em class="font-serif italic text-[--color-accent]">script</em>.
          </h1>

          <p class="mt-5 font-serif text-[clamp(1.1rem,1.6vw,1.4rem)] leading-[1.5] text-[--color-fg-dim]">
            把时间轴当作{" "}
            <em class="not-italic text-[--color-fg]">剧本</em> 来读。
          </p>

          <div class="mt-10 max-w-[520px] space-y-2.5 font-sans text-[0.95rem] leading-[1.75] text-[--color-fg-dim]">
            <p>
              A multi-line, text-first timeline for podcasts and talking-head
              videos — no more horizontal scrubbing.
            </p>
            <p>
              为播客与口播视频设计的多行折叠时间轴，用阅读取代横向拖动；所有处理在浏览器本地完成。
            </p>
          </div>

          <div class="mt-12 flex flex-wrap items-center gap-4">
            <a
              href="#demo"
              class="inline-flex items-center gap-2 bg-[--color-fg] px-7 py-3 font-sans text-[0.85rem] tracking-[0.08em] text-[--color-bg] transition-colors hover:bg-[--color-fg]/85"
            >
              Try the demo
              <span aria-hidden="true">↓</span>
            </a>
            <a
              href="#concept"
              class="inline-flex items-center gap-2 border border-[--color-fg]/20 px-7 py-3 font-sans text-[0.85rem] tracking-[0.08em] text-[--color-fg-dim] transition-colors hover:border-[--color-fg]/55 hover:text-[--color-fg]"
            >
              Read the rationale
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Right: timeline illustration */}
        <div class="flex justify-end lg:col-span-5">
          <TimelineIllustration />
        </div>
      </div>

      {/* scroll hint */}
      <div class="absolute inset-x-0 bottom-8 flex justify-center">
        <span class="font-sans text-[0.65rem] tracking-[0.4em] text-[--color-fg-faint]">
          SCROLL
        </span>
      </div>
    </section>
  );
};
