import * as React from "react";

const LazyDevtools =
	import.meta.env.DEV &&
	React.lazy(async () => {
		const { TanStackDevtools } = await import("@tanstack/react-devtools");
		const { TanStackRouterDevtoolsPanel } = await import(
			"@tanstack/react-router-devtools"
		);

		return {
			default: () => (
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
			),
		};
	});

export function Devtools() {
	if (!LazyDevtools) return null;
	return (
		<React.Suspense fallback={null}>
			<LazyDevtools />
		</React.Suspense>
	);
}
