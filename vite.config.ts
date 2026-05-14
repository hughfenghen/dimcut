import { defineConfig } from "vite";
import { resolve } from "node:path";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

const isLanding = process.env.BUILD_TARGET === "landing";

export default defineConfig({
  plugins: [tailwindcss(), solid()],
  base: isLanding ? "/dimcut/" : "/",
  server: {
    watch: {
      ignored: ["**/specs/**"],
    },
  },
  ...(isLanding
    ? {}
    : {
        build: {
          lib: {
            entry: resolve(__dirname, "src/lib/index.ts"),
            formats: ["es"],
            fileName: "index",
          },
          rollupOptions: {
            external: ["solid-js", "solid-js/web", "solid-js/store"],
          },
        },
      }),
});
