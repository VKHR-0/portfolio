import { createServerFn } from "@tanstack/react-start";
import { api } from "convex/_generated/api";
import { convexAuthQuery, getToken } from "#/lib/auth-server";

export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	return await getToken();
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		return await convexAuthQuery(api.auth.getCurrentUser, {});
	},
);

export const getCurrentUserId = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = await convexAuthQuery(api.auth.getCurrentUser, {});
		return user?._id ?? null;
	},
);
