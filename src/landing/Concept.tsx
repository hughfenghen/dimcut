import { type Component, For } from "solid-js";
import { useI18n } from "../i18n";

const pointKeys = [
  { romanKey: "concept.p1.roman", titleKey: "concept.p1.title", descKey: "concept.p1.desc", indent: "0%" },
  { romanKey: "concept.p2.roman", titleKey: "concept.p2.title", descKey: "concept.p2.desc", indent: "10%" },
  { romanKey: "concept.p3.roman", titleKey: "concept.p3.title", descKey: "concept.p3.desc", indent: "20%" },
];

export const Concept: Component = () => {
  const { t } = useI18n();

  return (
    <section id="concept" class="relative py-32">
      <div class="mx-auto max-w-[1200px] px-8">
        <header class="mb-20 max-w-[720px]">
          <p class="mb-4 font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[--color-fg-faint]">
            {t("concept.sectionLabel")}
          </p>
          <h2 class="font-serif text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-[1.25] text-[--color-fg]">
            {t("concept.title1")}{" "}
            <em class="italic text-[--color-accent]">
              {t("concept.titleEm")}
            </em>
            {t("concept.title2")}
          </h2>
        </header>

        <div class="space-y-16">
          <For each={pointKeys}>
            {(p, idx) => (
              <article
                class="border-t border-[--color-hairline] pt-10"
                style={{ "margin-left": p.indent }}
              >
                <div class="grid grid-cols-12 gap-6">
                  <div class="col-span-12 md:col-span-1">
                    <span class="font-serif text-[0.95rem] tracking-[0.3em] text-[--color-fg-faint]">
                      {t(p.romanKey)}
                    </span>
                  </div>
                  <div class="col-span-12 md:col-span-11">
                    <p class="font-serif text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.25] text-[--color-fg]">
                      <em class="italic">{t(p.titleKey)}</em>
                    </p>
                    <div class="mt-5 max-w-[640px] font-sans text-[0.95rem] leading-[1.75] text-[--color-fg-dim]">
                      <p>{t(p.descKey)}</p>
                    </div>
                  </div>
                </div>
                <span class="hidden">{idx()}</span>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  );
};
