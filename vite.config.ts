import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
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
		nitro({ preset: "bun" }),
		tailwindcss(),
		tanstackStart(),
		react(),
		//@ts-expect-error
		babel({
			presets: [reactCompilerPreset()],
		}),
	],
	build: {
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [{ name: "vendor", test: /\/react(?:-dom)?/ }],
				},
			},
		},
	},
	ssr: {
		noExternal: ["@convex-dev/better-auth"],
	},
});

export default config;
