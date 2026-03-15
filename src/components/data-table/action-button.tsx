import type * as React from "react";
import { Button } from "#/components/ui/button";

type DataTableActionButtonProps = React.ComponentProps<typeof Button>;

export function DataTableActionButton({
	className,
	size = "icon-xs",
	variant = "outline",
	...props
}: DataTableActionButtonProps) {
	return (
		<Button className={className} size={size} variant={variant} {...props} />
	);
}
