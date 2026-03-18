import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { HeadContent, Scripts, useRouteContext } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import type * as React from "react";
import { ThemeProvider } from "#/components/providers/theme-provider";
import { Devtools } from "#/components/shell";
import { Toaster } from "#/components/ui/sonner";
import { TooltipProvider } from "#/components/ui/tooltip";
import { authClient } from "#/lib/auth-client";
import { Route } from "#/routes/__root";

type RootProvidersProps = {
	children: React.ReactNode;
	theme?: "system" | "light" | "dark";
};

export function RootProviders({ children, theme }: RootProvidersProps) {
	const context = useRouteContext({ from: Route.id });
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
							<Devtools />
							<Analytics />
							<SpeedInsights />
							<Scripts />
						</body>
					</html>
				</TooltipProvider>
			</ThemeProvider>
		</ConvexBetterAuthProvider>
	);
}
