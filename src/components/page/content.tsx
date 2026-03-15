import type * as React from "react";
import { CardContent } from "#/components/ui/card";
import { cn } from "#/lib/utils";

export function PageContent({
	className,
	...props
}: React.ComponentProps<typeof CardContent>) {
	return <CardContent className={cn("min-w-0 flex-1", className)} {...props} />;
}
