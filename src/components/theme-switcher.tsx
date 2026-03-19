import { Desktop, Moon, Sun } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import type * as React from "react";
import { useTheme } from "#/components/providers/theme-provider";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import type { Theme } from "#/functions/theme";

const THEME_CONFIG: Record<Theme, { icon: React.ReactNode; label: string }> = {
	system: {
		icon: <HugeiconsIcon icon={Desktop} strokeWidth={2} />,
		label: "System",
	},
	light: {
		icon: <HugeiconsIcon icon={Sun} strokeWidth={2} />,
		label: "Light",
	},
	dark: {
		icon: <HugeiconsIcon icon={Moon} strokeWidth={2} />,
		label: "Dark",
	},
};

type ThemeSwitcherProps = {
	className?: string;
};

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
	"use no memo";
	const { theme, setTheme } = useTheme();

	return (
		<Tabs value={theme} onValueChange={(theme) => setTheme(theme)}>
			<TabsList variant="line" className={className}>
				{(["system", "light", "dark"] as const).map((t) => {
					const config = THEME_CONFIG[t];
					return (
						<TabsTrigger key={t} value={t} className="size-7">
							<motion.div
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
								transition={{ duration: 0.15 }}
							>
								{config.icon}
							</motion.div>
						</TabsTrigger>
					);
				})}
			</TabsList>
		</Tabs>
	);
}
