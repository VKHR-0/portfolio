import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";
import { env } from "#/env";
import { isAuthError } from "#/lib/auth-errors";

export const {
	handler,
	getToken,
	fetchAuthQuery: convexAuthQuery,
	fetchAuthMutation: convexAuthMutation,
	fetchAuthAction: convexAuthAction,
} = convexBetterAuthReactStart({
	convexUrl: env.VITE_CONVEX_URL,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
	jwtCache: {
		enabled: true,
		isAuthError,
	},
});
