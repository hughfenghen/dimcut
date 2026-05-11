import { type Component, For } from "solid-js";
import { useI18n } from "../i18n";
import { DELETED_RANGE_COLOR, ITEM_COLORS } from "../lib/constants";

const VIDEO_BG = `color-mix(in srgb, ${ITEM_COLORS.video} 14%, white)`;
const VIDEO_BORDER = `color-mix(in srgb, ${ITEM_COLORS.video} 38%, white)`;
const VIDEO_FRAME = `color-mix(in srgb, ${ITEM_COLORS.video} 28%, white)`;

const AUDIO_BG = `color-mix(in srgb, ${ITEM_COLORS.audio} 55%, white)`;
const AUDIO_BORDER = `color-mix(in srgb, ${ITEM_COLORS.audio} 70%, #c75792)`;
const AUDIO_BAR = `color-mix(in srgb, #c75792 55%, white)`;

const IMAGE_BG = `color-mix(in srgb, ${ITEM_COLORS.image} 55%, white)`;
const IMAGE_BORDER = `color-mix(in srgb, ${ITEM_COLORS.image} 70%, #4ea58a)`;

const WAVE_HEIGHTS = [0.38, 0.44, 0.19, 0.44, 1.0, 0.44, 0.25, 0.44, 0.13];

const WaveBars: Component<{ color: string }> = (props) => (
  <div class="absolute inset-x-2 inset-y-1.5 flex items-center justify-center gap-[3px]">
    <For each={WAVE_HEIGHTS}>
      {(h) => (
        <div
          class="flex-1 rounded-[2px]"
          style={{
            height: `${h * 100}%`,
            "min-width": "3px",
            "background-color": props.color,
          }}
        />
      )}
    </For>
  </div>
);

const FrameStrip: Component<{ color: string; count?: number }> = (props) => (
  <div class="absolute inset-x-2 inset-y-1.5 flex items-center gap-[2px]">
    <For each={Array.from({ length: props.count ?? 6 })}>
      {() => (
        <div
          class="h-full flex-1 rounded-[1px]"
          style={{ "background-color": props.color }}
        />
      )}
    </For>
  </div>
);

const TimeCell: Component<{ time?: string }> = (props) => (
  <div class="w-12 shrink-0 pr-2 text-right font-mono text-[10px] leading-[2] tabular-nums text-[--color-fg-faint]">
    {props.time ?? ""}
  </div>
);

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

      <div class="relative px-5 py-5">
        {/* text-row-A */}
        <div class="flex items-start">
          <TimeCell time="00:00" />
          <p class="flex-1 font-serif text-[12.5px] leading-[1.7] tracking-[0.01em] text-[--color-fg-dim]">
            {t("illust.textA.pre")}
            <span class="text-[--color-accent] line-through opacity-70">
              {t("illust.textA.strike")}
            </span>{" "}
            {t("illust.textA.mid")}{" "}
            <span class="rounded-[2px] bg-[--color-accent]/10 px-1 text-[--color-fg]">
              {t("illust.textA.highlight")}
            </span>
            {t("illust.textA.post")}
          </p>
        </div>

        {/* media-row-A */}
        <div class="mt-2 flex items-stretch">
          <TimeCell />
          <div class="relative flex h-10 flex-1 gap-1">
            <div
              class="relative flex-[2.4] overflow-hidden rounded-[4px] border"
              style={{
                "background-color": VIDEO_BG,
                "border-color": VIDEO_BORDER,
              }}
            >
              <FrameStrip color={VIDEO_FRAME} count={6} />
            </div>
            <div
              class="relative flex-[1.6] overflow-hidden rounded-[4px] border"
              style={{
                "background-color": AUDIO_BG,
                "border-color": AUDIO_BORDER,
              }}
            >
              <WaveBars color={AUDIO_BAR} />
            </div>
            <div
              class="relative flex-[1] overflow-hidden rounded-[4px] border"
              style={{
                "background-color": IMAGE_BG,
                "border-color": IMAGE_BORDER,
              }}
            />
          </div>
        </div>

        {/* text-row-B */}
        <div class="mt-5 flex items-start">
          <TimeCell time="00:12" />
          <p class="flex-1 font-serif text-[12.5px] leading-[1.7] tracking-[0.01em] text-[--color-fg-dim]">
            {t("illust.textB.pre")}
            <span class="text-[--color-accent] line-through opacity-70">
              {t("illust.textB.strike")}
            </span>{" "}
            {t("illust.textB.mid")}{" "}
            <span class="rounded-[2px] bg-[--color-accent]/10 px-1 text-[--color-fg]">
              {t("illust.textB.highlight")}
            </span>
            {t("illust.textB.post")}
          </p>
        </div>

        {/* media-row-B */}
        <div class="relative mt-2 flex items-stretch">
          <TimeCell />
          <div class="relative flex h-10 flex-1 gap-1">
            <div
              class="relative flex-[1.2] overflow-hidden rounded-[4px] border"
              style={{
                "background-color": VIDEO_BG,
                "border-color": VIDEO_BORDER,
              }}
            >
              <FrameStrip color={VIDEO_FRAME} count={3} />
            </div>
            {/* deleted segment — aligns with strike text above */}
            <div
              class="relative flex-[1.8] overflow-hidden rounded-[4px]"
              style={{
                "background-color": DELETED_RANGE_COLOR,
                "background-image":
                  "repeating-linear-gradient(135deg, rgba(180,40,40,0.18) 0 4px, transparent 4px 8px)",
                border: "1px dashed rgba(200,60,60,0.55)",
              }}
            />
            <div
              class="relative flex-[1.4] overflow-hidden rounded-[4px] border"
              style={{
                "background-color": AUDIO_BG,
                "border-color": AUDIO_BORDER,
              }}
            >
              <WaveBars color={AUDIO_BAR} />
            </div>
            <div
              class="relative flex-[0.9] overflow-hidden rounded-[4px] border"
              style={{
                "background-color": IMAGE_BG,
                "border-color": IMAGE_BORDER,
              }}
            />
          </div>
        </div>

        {/* selection overlay — anchors text-row-B highlight down to media-row-B deleted segment */}
        <div
          class="pointer-events-none absolute bg-[red]/20"
          style={{
            left: "32%",
            width: "30%",
            top: "70%",
            bottom: "14px",
          }}
        >
          {/* <span class="absolute -top-[7px] left-1/2 -translate-x-1/2 rounded-[2px] bg-[--color-accent] px-1 font-mono text-[8px] tracking-[0.18em] text-white"> */}
          {/*   SELECT */}
          {/* </span> */}
        </div>

        {/* playhead — spans all 4 rows */}
        <div
          class="pointer-events-none absolute top-4 bottom-3 w-[1.5px] bg-[--color-accent]"
          style={{ left: "calc(48px + 14%)" }}
        >
          <span class="absolute -top-1.5 -left-[3px] h-2 w-2 rounded-full bg-[--color-accent]" />
        </div>
      </div>
    </div>
  );
};
