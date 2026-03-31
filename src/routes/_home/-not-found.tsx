import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Footer } from "./-footer";
import { Header } from "./-header";
import { CornerSquare, Layout } from "./-layout";

export function NotFound() {
	return (
		<Layout>
			<Header />
			<div className="flex min-h-0 flex-1 flex-col px-4">
				<main className="container relative mx-auto flex max-w-4xl flex-1 items-center justify-center border-r-2 border-l-2 bg-background">
					<CornerSquare position="top-left" />
					<CornerSquare position="top-right" />

					<div className="relative mx-auto flex w-fit flex-col items-center justify-center gap-6 border-2 px-24 py-16 text-center">
						<CornerSquare position="top-left" mode="centered" />
						<CornerSquare position="top-right" mode="centered" />
						<h1 className="font-bold font-mono text-6xl">404</h1>
						<p className="text-lg text-muted-foreground">Page not found</p>
						<Button
							nativeButton={false}
							render={<Link to="/" />}
							variant="outline"
							className="rounded-none border-2 font-mono"
						>
							Go home
						</Button>
						<CornerSquare position="bottom-left" mode="centered" />
						<CornerSquare position="bottom-right" mode="centered" />
					</div>

					<CornerSquare position="bottom-left" />
					<CornerSquare position="bottom-right" />
				</main>
			</div>
			<Footer />
		</Layout>
	);
}
