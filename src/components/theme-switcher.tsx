import { Desktop, Moon, Sun } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "#/components/providers/theme-provider";
import { Button } from "#/components/ui/button";
import type { Theme } from "#/functions/theme";

const THEME_ORDER: Array<Theme> = ["system", "light", "dark"];

function getNextTheme(theme: Theme): Theme {
	const currentIndex = THEME_ORDER.indexOf(theme);
	const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
	return THEME_ORDER[nextIndex] ?? "system";
}

type ThemeSwitcherProps = {
	variant?:
		| "outline"
		| "ghost"
		| "default"
		| "secondary"
		| "destructive"
		| "link";
};

export function ThemeSwitcher({ variant = "outline" }: ThemeSwitcherProps) {
	const { theme, setTheme } = useTheme();
	const nextTheme = getNextTheme(theme);

	return (
		<Button
			variant={variant}
			size="icon"
			aria-label={`Theme: ${theme}. Switch to ${nextTheme}.`}
			title={`Theme: ${theme}. Switch to ${nextTheme}.`}
			onClick={() => {
				setTheme(nextTheme);
			}}
		>
			{theme === "light" ? (
				<HugeiconsIcon icon={Sun} strokeWidth={2} />
			) : theme === "dark" ? (
				<HugeiconsIcon icon={Moon} strokeWidth={2} />
			) : (
				<HugeiconsIcon icon={Desktop} strokeWidth={2} />
			)}
		</Button>
	);
}
