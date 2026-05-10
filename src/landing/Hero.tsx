import { type Component, Show } from "solid-js";
import { useI18n } from "../i18n";
import { TimelineIllustration } from "./TimelineIllustration.tsx";

export const Hero: Component = () => {
  const { t } = useI18n();

  return (
    <section id="top" class="relative flex min-h-[calc(100vh-4rem)] items-center">
      <div class="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-8 lg:grid-cols-12">
        <div class="lg:col-span-7">
          <p class="mb-8 font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[--color-fg-faint]">
            {t("hero.subtitle")}
          </p>

          <h1 class="font-serif text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-[--color-fg]">
            <Show when={t("hero.title1")}>
              {t("hero.title1")}
              <br />
            </Show>
            <Show when={t("hero.title2")}>{t("hero.title2")} </Show>
            <em class="font-serif italic text-[--color-accent]">
              {t("hero.titleEm")}
            </em>
            .
          </h1>

          <Show when={t("hero.subtitleLine")}>
            <p class="mt-5 font-serif text-[clamp(1.1rem,1.6vw,1.4rem)] leading-[1.5] text-[--color-fg-dim]">
              {t("hero.subtitleLine")}{" "}
              <em class="not-italic text-[--color-fg]">
                {t("hero.subtitleEm")}
              </em>{" "}
              。
            </p>
          </Show>

          <div class="mt-5 max-w-[520px] font-sans text-[0.95rem] leading-[1.75] text-[--color-fg-dim]">
            <p>{t("hero.desc1")}</p>
          </div>

          <div class="mt-12 flex flex-wrap items-center gap-4">
            <a
              href="#demo"
              class="inline-flex items-center gap-2 bg-[--color-fg] px-7 py-3 font-sans text-[0.85rem] tracking-[0.08em] text-[--color-bg] transition-colors hover:bg-[--color-fg]/85"
            >
              {t("hero.ctaPrimary")}
              <span aria-hidden="true">↓</span>
            </a>
            <a
              href="#concept"
              class="inline-flex items-center gap-2 border border-[--color-fg]/20 px-7 py-3 font-sans text-[0.85rem] tracking-[0.08em] text-[--color-fg-dim] transition-colors hover:border-[--color-fg]/55 hover:text-[--color-fg]"
            >
              {t("hero.ctaSecondary")}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div class="flex justify-end lg:col-span-5">
          <TimelineIllustration />
        </div>
      </div>

      <div class="absolute inset-x-0 bottom-8 flex justify-center">
        <span class="font-sans text-[0.65rem] tracking-[0.4em] text-[--color-fg-faint]">
          {t("hero.scroll")}
        </span>
      </div>
    </section>
  );
};
