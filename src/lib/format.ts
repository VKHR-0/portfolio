export const shortDate = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
});

export const mediumDate = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
});

export const longDate = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "long",
	day: "numeric",
});
