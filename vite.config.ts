import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	ssr: { resolve: { conditions: ["bun"] } },
	plugins: [
		nitro({ preset: "bun", serveStatic: "inline" }),

		tanstackStart(),
		viteReact(),
	],
});

export default config;
