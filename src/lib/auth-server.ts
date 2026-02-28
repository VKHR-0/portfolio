import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";
import { ConvexError } from "convex/values";
import { env } from "shared/env";

export const isAuthError = (error: unknown) => {
	const message =
		(error instanceof ConvexError && error.data) ||
		(error instanceof Error && error.message) ||
		"";
	return /auth/i.test(message);
};

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
