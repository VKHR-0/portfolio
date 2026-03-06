import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import * as z from "zod";

const postThemeValidator = z.union([
	z.literal("light"),
	z.literal("dark"),
	z.literal("system"),
]);
export type Theme = z.infer<typeof postThemeValidator>;
const storageKey = "_preferred-theme";

export const getTheme = createServerFn().handler(async () => {
	const cookie = getCookie(storageKey);
	return (cookie ?? "system") as Theme;
});

export const setTheme = createServerFn({ method: "POST" })
	.inputValidator(postThemeValidator)
	.handler(async ({ data }) => setCookie(storageKey, data));
