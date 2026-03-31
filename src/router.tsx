import { ConvexQueryClient } from "@convex-dev/react-query";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouteMask, createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider } from "convex/react";
import { toast } from "sonner";
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
		mutationCache: new MutationCache({
			onError: (error) => toast.error(error.message),
		}),
	});

	convexQueryClient.connect(queryClient);

	const router = routerWithQueryClient(
		createRouter({
			routeTree,
			routeMasks: [createTagMask, createSeriesMask, createCategoryMask],

			scrollRestoration: true,
			defaultPreload: "intent",
			defaultPreloadStaleTime: 0,

			context: {
				queryClient,
				convexQueryClient,
			},

			Wrap: ({ children }) => (
				<ConvexProvider client={convexQueryClient.convexClient}>
					{children}
				</ConvexProvider>
			),
		}),
		queryClient,
	);

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
