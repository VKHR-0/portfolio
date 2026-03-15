import type * as React from "react";
import { CardAction } from "#/components/ui/card";

export function PageAction({
	className,
	...props
}: React.ComponentProps<typeof CardAction>) {
	return <CardAction className={className} {...props} />;
}
