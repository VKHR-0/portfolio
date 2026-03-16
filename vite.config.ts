import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-oxc";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		devtools({
			editor: {
				name: "Zed",
				open: async (path, lineNumber, columnNumber) => {
					const { exec } = await import("node:child_process");
					exec(
						`zed "${(path).replaceAll("$", "\\$")}${lineNumber ? `:${lineNumber}` : ""}${columnNumber ? `:${columnNumber}` : ""}"`,
					);
				},
			},
		}),
		nitro({
			preset: "bun",
			rollupConfig: {
				external: [/^@sentry\//],
			},
		}),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		react(),
	],
	ssr: {
		noExternal: ["@convex-dev/better-auth"],
	},
});

export default config;
