import type * as React from "react";
import { CardTitle } from "#/components/ui/card";

export function PageTitle({
	className,
	...props
}: React.ComponentProps<typeof CardTitle>) {
	return <CardTitle className={className} {...props} />;
}
