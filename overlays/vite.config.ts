import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import sirv from "sirv";
import { existsSync, cpSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function addStorybookMiddleware(
  middlewares: import("vite").ViteDevServer["middlewares"],
  dir: string,
) {
  const serve = sirv(dir, { single: true });

  middlewares.use((req, res, next) => {
    if (req.url === "/storybook") {
      res.writeHead(301, { Location: "/storybook/" });
      res.end();
      return;
    }
    next();
  });

  middlewares.use("/storybook", serve);
}

function storybookPlugin(): Plugin {
  const dir = resolve(__dirname, "storybook-static");

  return {
    name: "serve-storybook",

    configureServer(server) {
      if (!existsSync(dir)) return;
      addStorybookMiddleware(server.middlewares, dir);
    },

    configurePreviewServer(server) {
      if (!existsSync(dir)) return;
      addStorybookMiddleware(server.middlewares, dir);
    },

    closeBundle() {
      if (!existsSync(dir)) return;
      cpSync(dir, resolve(__dirname, "dist", "storybook"), { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), storybookPlugin()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
