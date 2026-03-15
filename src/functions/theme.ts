import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";

const postThemeValidator = z.union([
	z.literal("light"),
	z.literal("dark"),
	z.literal("system"),
]);
export type Theme = z.infer<typeof postThemeValidator>;
const storageKey = "_preferred-theme";

export const getTheme = createServerFn().handler(async () => {
	const { getCookie } = await import("@tanstack/react-start/server");
	const cookie = getCookie(storageKey);
	return (cookie ?? "system") as Theme;
});

export const setTheme = createServerFn({ method: "POST" })
	.inputValidator(postThemeValidator)
	.handler(async ({ data }) => {
		const { setCookie } = await import("@tanstack/react-start/server");
		setCookie(storageKey, data);
	});
