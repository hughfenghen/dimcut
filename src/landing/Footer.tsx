import { type Component } from "solid-js";
import { useI18n } from "../i18n";

const GITHUB_URL = "https://github.com/hughfenghen/dimcut";
const AUTHOR_URL = "https://fenghen.me";

export const Footer: Component = () => {
  const { t } = useI18n();

  return (
    <footer class="border-t border-[--color-hairline] py-10">
      <div class="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-3 px-8 text-[0.78rem] text-[--color-fg-dim] md:flex-row md:items-center">
        <p class="tracking-[0.04em]">
          {t("footer.copyright")}{" "}
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="border-b border-[--color-fg-faint] text-[--color-fg] transition-colors hover:border-[--color-accent] hover:text-[--color-accent]"
          >
            {t("footer.author")}
          </a>
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="tracking-[0.1em] uppercase transition-colors hover:text-[--color-fg]"
        >
          {t("footer.github")}
        </a>
      </div>
    </footer>
  );
};
