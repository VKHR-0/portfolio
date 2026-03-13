import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { RootProviders } from "#/components/providers";
import { ErrorPage, LoadingPage, NotFoundPage } from "#/components/shell";
import { getAuth } from "#/features/auth";
import { getTheme } from "#/features/theme";
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
	shellComponent: ShellComponent,
	pendingComponent: LoadingPage,
	errorComponent: ErrorPage,
	notFoundComponent: NotFoundPage,
});

function ShellComponent() {
	const theme = Route.useLoaderData();
	return (
		<RootProviders theme={theme}>
			<Outlet />
		</RootProviders>
	);
}
