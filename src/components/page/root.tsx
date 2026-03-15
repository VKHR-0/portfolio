import type * as React from "react";
import { Card } from "#/components/ui/card";
import { cn } from "#/lib/utils";

export function PageRoot({
	className,
	...props
}: React.ComponentProps<typeof Card>) {
	return <Card className={cn("min-w-0 flex-1", className)} {...props} />;
}
