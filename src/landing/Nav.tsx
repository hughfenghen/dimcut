import { type Component } from "solid-js";
import { useI18n } from "../i18n";

const GITHUB_URL = "https://github.com/hughfenghen/dimcut";

export const Nav: Component = () => {
  const { t, locale, setLocale } = useI18n();

  return (
    <nav class="border-b border-[--color-hairline] bg-[rgba(250,250,247,0.78)]">
      <div class="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4">
        <a
          href="#top"
          class="font-serif text-[1.1rem] font-semibold tracking-[0.08em] text-[--color-fg]"
        >
          Dim<span class="text-[--color-accent]">Cut</span>
        </a>
        <div class="flex items-center gap-7 text-[0.78rem] tracking-[0.1em] text-[--color-fg-dim]">
          <a href="#concept" class="transition-colors hover:text-[--color-fg]">
            {t("nav.concept")}
          </a>
          <a href="#demo" class="transition-colors hover:text-[--color-fg]">
            {t("nav.demo")}
          </a>
          <button
            type="button"
            class="cursor-pointer transition-colors hover:text-[--color-fg]"
            onClick={() => setLocale(locale() === "en" ? "zh" : "en")}
          >
            {t("nav.langToggle")}
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[--color-fg]/15 px-3 py-1.5 transition-colors hover:border-[--color-fg]/60 hover:text-[--color-fg]"
          >
            {t("nav.github")}
          </a>
        </div>
      </div>
    </nav>
  );
};
