import { useRouter } from "@tanstack/react-router";
import React from "react";
import { setThemeServerFn, type Theme } from "#/functions/theme";
import { FunctionOnce } from "#/lib/function-once";

type ThemeContext = {
	theme: Theme;
	setTheme: (value: Theme) => void;
	resolvedTheme: "light" | "dark";
};
type Props = React.PropsWithChildren<{ theme: Theme }>;

const ThemeContext = React.createContext<ThemeContext | null>(null);

export function ThemeProvider({ children, theme: defaultTheme }: Props) {
	const router = useRouter();
	const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
	const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
		"light",
	);

	React.useEffect(() => {
		const root = window.document.documentElement;
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		function updateTheme() {
			const currentTheme = theme;
			root.classList.remove("light", "dark");

			if (currentTheme === "system") {
				const systemTheme = mediaQuery.matches ? "dark" : "light";
				setResolvedTheme(systemTheme);
				root.classList.add(systemTheme);
				return;
			}

			setResolvedTheme(currentTheme);
			root.classList.add(currentTheme);
		}

		mediaQuery.addEventListener("change", updateTheme);
		updateTheme();

		return () => mediaQuery.removeEventListener("change", updateTheme);
	}, [theme]);

	function setTheme(value: Theme) {
		setThemeState(value);
		setThemeServerFn({ data: value }).then(() => router.invalidate());
	}

	return (
		<ThemeContext value={{ theme, setTheme, resolvedTheme }}>
			<FunctionOnce param={theme}>
				{(theme) => {
					if (
						theme === "dark" ||
						((theme === "system" || !theme) &&
							window.matchMedia("(prefers-color-scheme: dark)").matches)
					) {
						document.documentElement.classList.add("dark");
					} else {
						document.documentElement.classList.remove("dark");
					}
				}}
			</FunctionOnce>
			{children}
		</ThemeContext>
	);
}

export function useTheme() {
	const context = React.use(ThemeContext);
	if (!context) throw new Error("useTheme called outside of ThemeProvider!");
	return context;
}
