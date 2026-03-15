import type * as React from "react";
import { CardFooter } from "#/components/ui/card";

export function PageFooter({
	className,
	...props
}: React.ComponentProps<typeof CardFooter>) {
	return <CardFooter className={className} {...props} />;
}
