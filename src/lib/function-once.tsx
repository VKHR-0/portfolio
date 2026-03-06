import { ScriptOnce } from "@tanstack/react-router";

/**
 * Serializes a function call into a `<script>` tag that executes exactly once
 * during SSR and is not re-evaluated on client hydration. Used for inline
 * scripts that must run synchronously before React mounts — e.g. reading a
 * cookie and applying a theme class to `<html>` to prevent FOUC.
 */
export function FunctionOnce<T = unknown>({
	children,
	param,
}: {
	children: (param: T) => unknown;
	param?: T;
}) {
	return (
		<ScriptOnce>
			{`(${children.toString()})(${JSON.stringify(param)})`}
		</ScriptOnce>
	);
}
