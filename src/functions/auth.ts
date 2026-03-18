import { createServerFn } from "@tanstack/react-start";
import { api } from "convex/_generated/api";
import { convexAuthQuery, getToken } from "#/lib/auth-server";

export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	try {
		return await getToken();
	} catch {
		return null;
	}
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		return await convexAuthQuery(api.auth.getAuthUser, {});
	},
);

export const getCurrentUserId = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = await convexAuthQuery(api.auth.getAuthUser, {});
		return user?._id ?? null;
	},
);
