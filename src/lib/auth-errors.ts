import { ConvexError } from "convex/values";

export const isAuthError = (error: unknown) => {
	const message =
		(error instanceof ConvexError && error.data) ||
		(error instanceof Error && error.message) ||
		"";
	return /auth/i.test(message);
};
