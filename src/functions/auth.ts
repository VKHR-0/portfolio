import { createServerFn } from "@tanstack/react-start";
import { getToken } from "#/lib/auth-server";

export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	try {
		return await getToken();
	} catch (error) {
		console.error("getToken error:", error);
		return null;
	}
});
