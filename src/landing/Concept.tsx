import { type Component, For } from "solid-js";

const points = [
  {
    roman: "I.",
    en: "Break the 1D timeline.",
    zh: "把一维时间轴折叠成多行。",
    enDesc: "Reading replaces horizontal scrubbing — paging instead of dragging.",
    zhDesc: "用翻页式的阅读节奏取代无穷无尽的横向拖动。",
    indent: "0%",
  },
  {
    roman: "II.",
    en: "Pack clips densely.",
    zh: "不重叠的片段共享一行。",
    enDesc:
      "Video, audio and images coexist on a single track when they don't collide — higher information density, fewer rows.",
    zhDesc: "视频、音频、图像在不冲突时共栖一行；信息更密，行数更少。",
    indent: "10%",
  },
  {
    roman: "III.",
    en: "Read, don't scrub.",
    zh: "用文字定位，而不是用波形。",
    enDesc:
      "Speech transcripts become the primary navigation layer — editing podcasts feels like editing a document.",
    zhDesc: "ASR 转写文本作为主导航层，编辑节目像编辑一篇文档。",
    indent: "20%",
  },
];

export const Concept: Component = () => {
  return (
    <section id="concept" class="relative py-32">
      <div class="mx-auto max-w-[1200px] px-8">
        <header class="mb-20 max-w-[720px]">
          <p class="mb-4 font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[--color-fg-faint]">
            II. · Rationale · 设计主张
          </p>
          <h2 class="font-serif text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-[1.25] text-[--color-fg]">
            For most talking content, editing is{" "}
            <em class="italic text-[--color-accent]">finding ideas</em>, not
            frame-perfect timing.
          </h2>
          <p class="mt-4 font-serif text-[1.1rem] leading-[1.6] text-[--color-fg-dim]">
            对大多数口播内容来说，剪辑的本质是定位与重排表达 ——
            而不是逐帧对齐。
          </p>
        </header>

        <div class="space-y-16">
          <For each={points}>
            {(p, idx) => (
              <article
                class="border-t border-[--color-hairline] pt-10"
                style={{ "margin-left": p.indent }}
              >
                <div class="grid grid-cols-12 gap-6">
                  <div class="col-span-12 md:col-span-1">
                    <span class="font-serif text-[0.95rem] tracking-[0.3em] text-[--color-fg-faint]">
                      {p.roman}
                    </span>
                  </div>
                  <div class="col-span-12 md:col-span-11">
                    <p class="font-serif text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.25] text-[--color-fg]">
                      <em class="italic">{p.en}</em>
                    </p>
                    <p class="mt-1 font-serif text-[clamp(1.3rem,2vw,1.7rem)] leading-[1.3] text-[--color-fg]">
                      {p.zh}
                    </p>
                    <div class="mt-5 max-w-[640px] space-y-2 font-sans text-[0.95rem] leading-[1.75] text-[--color-fg-dim]">
                      <p>{p.enDesc}</p>
                      <p>{p.zhDesc}</p>
                    </div>
                  </div>
                </div>
                {/* keep idx referenced to avoid lint */}
                <span class="hidden">{idx()}</span>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  );
};
