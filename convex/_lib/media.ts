import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * Resolves a media document ID to a servable storage URL.
 *
 * @returns The storage URL, or undefined if the media document doesn't exist.
 */
export async function resolveImageUrl(
	ctx: QueryCtx,
	imageId: Id<"media"> | undefined,
): Promise<string | undefined> {
	if (!imageId) {
		return undefined;
	}

	const media = await ctx.db.get(imageId);
	if (!media) {
		return undefined;
	}

	return (await ctx.storage.getUrl(media.storageId)) ?? undefined;
}
