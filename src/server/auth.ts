import { createServerFn } from "@tanstack/react-start";
import { api } from "convex/_generated/api";

export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	const { getToken } = await import("#/lib/auth-server");
	return await getToken();
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const { convexAuthQuery } = await import("#/lib/auth-server");
		return await convexAuthQuery(api.auth.getCurrentUser, {});
	},
);

export const getCurrentUserId = createServerFn({ method: "GET" }).handler(
	async () => {
		const { convexAuthQuery } = await import("#/lib/auth-server");
		const user = await convexAuthQuery(api.auth.getCurrentUser, {});
		return user?._id ?? null;
	},
);
