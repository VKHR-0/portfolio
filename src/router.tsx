import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouteMask, createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexProvider } from "convex/react";
import { ErrorPage } from "#/components/error";
import { LoadingPage } from "#/components/loading";
import { NotFoundPage } from "#/components/not-found";
import { env } from "#/env";
import { routeTree } from "./routeTree.gen";

const createTagMask = createRouteMask({
	routeTree,
	from: "/admin/tags/new",
	to: "/admin/tags",
});

const createSeriesMask = createRouteMask({
	routeTree,
	from: "/admin/series/new",
	to: "/admin/series",
});

const createCategoryMask = createRouteMask({
	routeTree,
	from: "/admin/categories/new",
	to: "/admin/categories",
});

export function getRouter() {
	const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL, {
		expectAuth: true,
	});

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = createRouter({
		routeTree,
		routeMasks: [createTagMask, createSeriesMask, createCategoryMask],
		notFoundMode: "root",

		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,

		defaultPendingComponent: LoadingPage,
		defaultErrorComponent: ErrorPage,
		defaultNotFoundComponent: NotFoundPage,

		context: {
			queryClient,
			convexQueryClient,
		},

		Wrap: ({ children }) => (
			<ConvexProvider client={convexQueryClient.convexClient}>
				{children}
			</ConvexProvider>
		),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
