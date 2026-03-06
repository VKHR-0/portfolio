import { createServerFn } from "@tanstack/react-start";
import { SIDEBAR_COOKIE_NAME } from "#/components/ui/sidebar";

export const getSidebarOpenState = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getCookie } = await import("@tanstack/react-start/server");
		const cookieValue = getCookie(SIDEBAR_COOKIE_NAME);

		if (cookieValue === "true") {
			return true;
		}

		if (cookieValue === "false") {
			return false;
		}

		return true;
	},
);
