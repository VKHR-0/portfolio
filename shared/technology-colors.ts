export const TECHNOLOGY_COLORS = {
	red: {
		bg: "bg-red-100 dark:bg-red-950",
		text: "text-red-700 dark:text-red-300",
		border: "border-red-300 dark:border-red-800",
	},
	orange: {
		bg: "bg-orange-100 dark:bg-orange-950",
		text: "text-orange-700 dark:text-orange-300",
		border: "border-orange-300 dark:border-orange-800",
	},
	amber: {
		bg: "bg-amber-100 dark:bg-amber-950",
		text: "text-amber-700 dark:text-amber-300",
		border: "border-amber-300 dark:border-amber-800",
	},
	yellow: {
		bg: "bg-yellow-100 dark:bg-yellow-950",
		text: "text-yellow-700 dark:text-yellow-300",
		border: "border-yellow-300 dark:border-yellow-800",
	},
	lime: {
		bg: "bg-lime-100 dark:bg-lime-950",
		text: "text-lime-700 dark:text-lime-300",
		border: "border-lime-300 dark:border-lime-800",
	},
	green: {
		bg: "bg-green-100 dark:bg-green-950",
		text: "text-green-700 dark:text-green-300",
		border: "border-green-300 dark:border-green-800",
	},
	emerald: {
		bg: "bg-emerald-100 dark:bg-emerald-950",
		text: "text-emerald-700 dark:text-emerald-300",
		border: "border-emerald-300 dark:border-emerald-800",
	},
	cyan: {
		bg: "bg-cyan-100 dark:bg-cyan-950",
		text: "text-cyan-700 dark:text-cyan-300",
		border: "border-cyan-300 dark:border-cyan-800",
	},
	blue: {
		bg: "bg-blue-100 dark:bg-blue-950",
		text: "text-blue-700 dark:text-blue-300",
		border: "border-blue-300 dark:border-blue-800",
	},
	indigo: {
		bg: "bg-indigo-100 dark:bg-indigo-950",
		text: "text-indigo-700 dark:text-indigo-300",
		border: "border-indigo-300 dark:border-indigo-800",
	},
	violet: {
		bg: "bg-violet-100 dark:bg-violet-950",
		text: "text-violet-700 dark:text-violet-300",
		border: "border-violet-300 dark:border-violet-800",
	},
	pink: {
		bg: "bg-pink-100 dark:bg-pink-950",
		text: "text-pink-700 dark:text-pink-300",
		border: "border-pink-300 dark:border-pink-800",
	},
} as const;

export type TechnologyColorKey = keyof typeof TECHNOLOGY_COLORS;

export const TECHNOLOGY_COLOR_KEYS = Object.keys(
	TECHNOLOGY_COLORS,
) as Array<TechnologyColorKey>;

export function getRandomColorKey(): TechnologyColorKey {
	const index = Math.floor(Math.random() * TECHNOLOGY_COLOR_KEYS.length);
	return TECHNOLOGY_COLOR_KEYS[index] ?? "blue";
}
