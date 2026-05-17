import { type Component } from "solid-js";
import { useI18n } from "../i18n";
import App from "../demo/App.tsx";

export const DemoSection: Component = () => {
  const { t } = useI18n();

  return (
    <section id="demo" class="relative bg-[--color-bg-demo] py-28">
      <div class="mx-auto max-w-300 px-8">
        <header class="mb-12 max-w-190">
          <p class="mb-4 font-sans text-[0.72rem] uppercase tracking-[0.32em] text-[--color-fg-faint]">
            {t("demo.sectionLabel")}
          </p>
          <h2 class="font-serif text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-tight text-[--color-fg]">
            {t("demo.title")}
          </h2>
          <p class="mt-4 font-sans text-[0.95rem] leading-[1.75] text-[--color-fg-dim]">
            {t("demo.desc")}
          </p>
        </header>
      </div>

      <div class="mx-auto w-fit min-h-[calc(100vh-2rem)] rounded-xl border border-black/30 bg-white shadow-[0_30px_60px_-30px_rgb(10,10,10)]">
        <App />
      </div>
    </section>
  );
};
