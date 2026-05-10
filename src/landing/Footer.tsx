import { type Component } from "solid-js";

const GITHUB_URL = "https://github.com/hughfenghen/dimcut";
const AUTHOR_URL = "https://fenghen.me";

export const Footer: Component = () => {
  return (
    <footer class="border-t border-[--color-hairline] py-10">
      <div class="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-3 px-8 text-[0.78rem] text-[--color-fg-dim] md:flex-row md:items-center">
        <p class="tracking-[0.04em]">
          © 2026 DimCut · by{" "}
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="border-b border-[--color-fg-faint] text-[--color-fg] transition-colors hover:border-[--color-accent] hover:text-[--color-accent]"
          >
            风痕
          </a>
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="tracking-[0.1em] uppercase transition-colors hover:text-[--color-fg]"
        >
          GitHub ↗
        </a>
      </div>
    </footer>
  );
};
