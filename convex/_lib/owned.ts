import type { DocumentByName, TableNamesInDataModel } from "convex/server";
import { ConvexError } from "convex/values";
import type { DataModel, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

type TableNames = TableNamesInDataModel<DataModel>;

/**
 * Extracts table names whose documents contain an `authorId` field.
 * Automatically updates when new owned tables are added to the schema.
 */
export type OwnedTable = {
	[T in TableNames]: DocumentByName<DataModel, T> extends { authorId: string }
		? T
		: never;
}[TableNames];

/**
 * Asserts that the given user owns the document (via its `authorId` field).
 * Throws a `ConvexError` if the document doesn't exist or the user
 * is not the author.
 *
 * @example
 * ```ts
 * export const update = authedMutation({
 *   args: { id: v.id("posts"), title: v.string() },
 *   handler: async (ctx, args) => {
 *     await assertDocumentOwner(ctx, {
 *       documentId: args.id,
 *       userId: ctx.userId,
 *       documentType: "posts",
 *     });
 *     await ctx.db.patch(args.id, { title: args.title });
 *   },
 * });
 * ```
 */
export async function assertDocumentOwner(
	ctx: QueryCtx,
	opts: {
		documentId: Id<OwnedTable>;
		userId: string;
		documentType: OwnedTable;
	},
) {
	const doc = await ctx.db.get(opts.documentId);

	if (!doc) {
		throw new ConvexError(`${opts.documentType} not found.`);
	}

	const authorId = (doc as Record<string, unknown>).authorId as
		| string
		| undefined;

	if (authorId !== opts.userId) {
		throw new ConvexError(
			`You do not have permission to modify this ${opts.documentType}.`,
		);
	}
}
