import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ErrorPage } from "#/components/error";
import { LoadingPage } from "#/components/loading";
import { NotFoundPage } from "#/components/not-found";
import { RootProviders } from "#/components/providers";
import { getAuth } from "#/server/auth";
import { getTheme } from "#/server/theme";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "VKHR | Portfolio",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	beforeLoad: async ({ context }) => {
		const token = await getAuth();

		if (token) context.convexQueryClient.serverHttpClient?.setAuth(token);

		return {
			isAuthenticated: !!token,
			token,
		};
	},
	loader: () => getTheme(),
	shellComponent: () => {
		const theme = Route.useLoaderData();
		return (
			<RootProviders theme={theme}>
				<Outlet />
			</RootProviders>
		);
	},
	pendingComponent: () => (
		<RootProviders theme="system">
			<LoadingPage />
		</RootProviders>
	),
	errorComponent: (props) => (
		<RootProviders theme="system">
			<ErrorPage {...props} />
		</RootProviders>
	),
	notFoundComponent: () => (
		<RootProviders theme="system">
			<NotFoundPage />
		</RootProviders>
	),
});
