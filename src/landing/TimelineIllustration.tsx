import { type Component, For } from "solid-js";
import { useI18n } from "../i18n";

const ruler = ["00:00", "00:08", "00:16", "00:24"];

const waveBars = (count: number, seed: number) => {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(0.25 + (s / 233280) * 0.75);
  }
  return out;
};

const Wave: Component<{
  count?: number;
  seed?: number;
  tone?: "video" | "audio";
}> = (props) => {
  const bars = () => waveBars(props.count ?? 28, props.seed ?? 7);
  return (
    <div class="absolute inset-x-2 bottom-1.5 flex h-3 items-end gap-[2px]">
      <For each={bars()}>
        {(h) => (
          <div
            class={`flex-1 rounded-[1px] ${
              props.tone === "audio"
                ? "bg-emerald-900/30"
                : "bg-slate-700/40"
            }`}
            style={{ height: `${h * 100}%`, "min-width": "2px" }}
          />
        )}
      </For>
    </div>
  );
};

export const TimelineIllustration: Component = () => {
  const { t } = useI18n();

  return (
    <div class="relative w-full max-w-[520px] rounded-[10px] border border-[--color-hairline] bg-white shadow-[0_30px_60px_-30px_rgba(10,10,10,0.18)]">
      <div class="flex items-center gap-1.5 border-b border-[--color-hairline] px-4 py-3">
        <span class="h-2.5 w-2.5 rounded-full bg-[#e0a8a0]" />
        <span class="h-2.5 w-2.5 rounded-full bg-[#dcc28a]" />
        <span class="h-2.5 w-2.5 rounded-full bg-[#a8c4a4]" />
        <span class="ml-3 font-serif text-[11px] tracking-[0.2em] text-[--color-fg-faint]">
          {t("illust.title")}
        </span>
      </div>

      <div class="px-5 py-4">
        <div class="flex justify-between border-b border-[--color-hairline] pb-1.5 text-[10px] tracking-[0.18em] text-[--color-fg-faint] tabular-nums">
          <For each={ruler}>{(time) => <span>{time}</span>}</For>
        </div>

        <div class="relative mt-3 flex items-stretch gap-1">
          <div class="w-5 pt-1 text-center text-[10px] text-[--color-fg-faint]">
            01
          </div>
          <div class="relative flex h-10 flex-1 gap-1">
            <div class="relative flex-[3] overflow-hidden rounded-[4px] border border-slate-300/70 bg-gradient-to-br from-slate-200 to-slate-100">
              <span class="absolute left-2 top-1.5 text-[9px] tracking-[0.12em] text-slate-600/80">
                {t("illust.video")}
              </span>
              <Wave count={36} seed={11} />
            </div>
            <div class="flex-[1]" />
          </div>
        </div>

        <div class="relative mt-1.5 flex items-stretch gap-1">
          <div class="w-5 pt-1 text-center text-[10px] text-[--color-fg-faint]">
            02
          </div>
          <div class="relative flex h-10 flex-1 gap-1">
            <div class="flex-[1.2]" />
            <div class="relative flex-[1.8] overflow-hidden rounded-[4px] border border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-emerald-100/60">
              <span class="absolute left-2 top-1.5 text-[9px] tracking-[0.12em] text-emerald-700/80">
                {t("illust.audio")}
              </span>
              <Wave count={28} seed={3} tone="audio" />
            </div>
            <div class="flex-[0.4]" />
            <div class="relative flex-[1] overflow-hidden rounded-[4px] border border-amber-300/70 bg-gradient-to-br from-amber-50 to-amber-100/60">
              <span class="absolute left-2 top-1.5 text-[9px] tracking-[0.12em] text-amber-700/80">
                {t("illust.img")}
              </span>
            </div>
            <div
              class="pointer-events-none absolute top-0 bottom-0 rounded-[2px] border-x-[1.5px] border-[--color-accent] bg-[--color-accent]/10"
              style={{ left: "26%", width: "22%" }}
            />
          </div>
        </div>

        <div class="relative mt-1.5 flex items-stretch gap-1">
          <div class="w-5 pt-1 text-center text-[10px] text-[--color-fg-faint]">
            03
          </div>
          <div class="relative flex h-10 flex-1 gap-1">
            <div class="flex-[0.6]" />
            <div class="relative flex-[2.4] overflow-hidden rounded-[4px] border border-slate-300/70 bg-gradient-to-br from-slate-200 to-slate-100">
              <span class="absolute left-2 top-1.5 text-[9px] tracking-[0.12em] text-slate-600/80">
                {t("illust.video")}
              </span>
              <Wave count={32} seed={19} />
            </div>
            <div class="flex-[1]" />
          </div>
        </div>

        <div class="ml-7 mt-3 rounded-[4px] border border-[--color-hairline] bg-[--color-bg-demo] px-3 py-2">
          <p class="font-serif text-[12px] leading-[1.85] tracking-[0.01em] text-[--color-fg-dim]">
            {t("illust.asrText1")}{" "}
            <span class="rounded-[2px] bg-[--color-accent]/10 px-1 text-[--color-fg]">
              {t("illust.asrHighlight")}
            </span>
            ,{" "}
            <span class="text-[--color-accent] line-through opacity-70">
              {t("illust.asrStrike")}
            </span>{" "}
            <span class="text-[--color-fg]">
              {t("illust.asrText2")}
            </span>
            .
          </p>
        </div>

        <div
          class="pointer-events-none absolute top-12 bottom-3 w-[2px] bg-[--color-accent]"
          style={{ left: "calc(20px + 2.5rem + 12%)" }}
        >
          <span class="absolute -top-1.5 -left-[3px] h-2 w-2 rounded-full bg-[--color-accent]" />
        </div>
      </div>
    </div>
  );
};
