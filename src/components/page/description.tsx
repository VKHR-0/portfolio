import type * as React from "react";
import { CardDescription } from "#/components/ui/card";

export function PageDescription({
	className,
	...props
}: React.ComponentProps<typeof CardDescription>) {
	return <CardDescription className={className} {...props} />;
}
