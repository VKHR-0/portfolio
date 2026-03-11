export type AsyncResult<TValue> =
	| { ok: true; value: TValue }
	| { ok: false; error: unknown };

export function toAsyncResult<TValue>(
	promise: Promise<TValue>,
): Promise<AsyncResult<TValue>> {
	return promise.then(
		(value) => ({ ok: true, value }),
		(error: unknown) => ({ ok: false, error }),
	);
}

export function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}
