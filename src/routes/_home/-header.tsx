import { Link } from "@tanstack/react-router";
import { ThemeSwitcher } from "#/components/theme-switcher";
import { Button } from "#/components/ui/button";

export function Header() {
	return (
		<header className="border-b-2">
			<div className="px-4">
				<div className="container mx-auto flex max-w-4xl items-center justify-between border-r-2 border-l-2 py-2">
					<Button
						nativeButton={false}
						variant="link"
						className="text-foreground"
						render={<Link to="/" />}
					>
						VKHR.dev
					</Button>
					<div className="mx-2.5 border-2 bg-background px-1">
						<ThemeSwitcher />
					</div>
				</div>
			</div>
		</header>
	);
}
