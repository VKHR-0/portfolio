import type * as React from "react";
import { CardHeader } from "#/components/ui/card";
import { cn } from "#/lib/utils";

export function PageHeader({
	className,
	...props
}: React.ComponentProps<typeof CardHeader>) {
	return <CardHeader className={cn("items-center", className)} {...props} />;
}
