import { AuthBoundary } from "@convex-dev/better-auth/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { authClient } from "#/lib/auth-client";
import { isAuthError } from "#/lib/auth-errors";

export const AuthedPage = ({ children }: React.PropsWithChildren) => {
	const navigate = useNavigate();
	return (
		<AuthBoundary
			authClient={authClient}
			onUnauth={() =>
				navigate({
					to: "/admin/login",
					search: { redirect: window.location.href },
				})
			}
			getAuthUserFn={api.auth.getAuthUser}
			isAuthError={isAuthError}
		>
			{children}
		</AuthBoundary>
	);
};
