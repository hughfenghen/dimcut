import { type Component } from "solid-js";

const GITHUB_URL = "https://github.com/hughfenghen/dimcut";

export const Nav: Component = () => {
  return (
    <nav class="fixed inset-x-0 top-0 z-50 border-b border-[--color-hairline] bg-[rgba(250,250,247,0.78)] backdrop-blur-md">
      <div class="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4">
        <a
          href="#top"
          class="font-serif text-[1.1rem] font-semibold tracking-[0.08em] text-[--color-fg]"
        >
          Dim<span class="text-[--color-accent]">Cut</span>
        </a>
        <div class="flex items-center gap-7 text-[0.78rem] tracking-[0.1em] text-[--color-fg-dim]">
          <a
            href="#concept"
            class="transition-colors hover:text-[--color-fg]"
          >
            CONCEPT
          </a>
          <a
            href="#demo"
            class="transition-colors hover:text-[--color-fg]"
          >
            DEMO
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[--color-fg]/15 px-3 py-1.5 transition-colors hover:border-[--color-fg]/60 hover:text-[--color-fg]"
          >
            GITHUB ↗
          </a>
        </div>
      </div>
    </nav>
  );
};
