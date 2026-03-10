import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { HeadContent, Scripts, useRouteContext } from "@tanstack/react-router";
import * as React from "react";
import { ThemeProvider } from "#/components/providers/theme-provider";
import { Toaster } from "#/components/ui/sonner";
import { TooltipProvider } from "#/components/ui/tooltip";
import { authClient } from "#/lib/auth-client";
import { Route as RootRoute } from "#/routes/__root";

const Devtools =
	import.meta.env.DEV &&
	React.lazy(() =>
		import("#/components/devtools").then((module) => ({
			default: module.Devtools,
		})),
	);

type RootProvidersProps = {
	children: React.ReactNode;
	theme?: "system" | "light" | "dark";
};

export function RootProviders({ children, theme }: RootProvidersProps) {
	const context = useRouteContext({ from: RootRoute.id });
	const initialTheme = theme ?? "system";

	return (
		<ConvexBetterAuthProvider
			client={context.convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={context.token}
		>
			<ThemeProvider theme={initialTheme}>
				<TooltipProvider>
					<html lang="en" suppressHydrationWarning>
						<head>
							<HeadContent />
						</head>
						<body>
							{children}
							<Toaster position="top-center" />
							{Devtools ? (
								<React.Suspense fallback={null}>
									<Devtools />
								</React.Suspense>
							) : null}
							<Scripts />
						</body>
					</html>
				</TooltipProvider>
			</ThemeProvider>
		</ConvexBetterAuthProvider>
	);
}
