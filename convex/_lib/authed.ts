import type { GenericQueryCtx } from "convex/server";
import {
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import type { DataModel } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { authComponent } from "../auth";

/**
 * Shared auth input for all authenticated function builders.
 * Resolves the current user and adds `userId` to ctx.
 * Throws if the user is not signed in.
 */
export const authInput = {
	args: {},
	input: async (ctx: GenericQueryCtx<DataModel>) => {
		const user = await authComponent.getAuthUser(ctx);
		return { ctx: { userId: user._id }, args: {} };
	},
} as const;

/**
 * Query builder that requires authentication.
 * Adds `userId` to `ctx` so handlers can access it directly.
 *
 * @example
 * ```ts
 * export const myQuery = authedQuery({
 *   args: { id: v.id("posts") },
 *   handler: async (ctx, args) => {
 *     // ctx.userId is the authenticated user's ID
 *     return ctx.db.get(args.id);
 *   },
 * });
 * ```
 */
export const authedQuery = customQuery(query, authInput);

/**
 * Mutation builder that requires authentication.
 * Adds `userId` to `ctx` so handlers can access it directly.
 *
 * @example
 * ```ts
 * export const myMutation = authedMutation({
 *   args: { title: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.insert("posts", { title: args.title, authorId: ctx.userId });
 *   },
 * });
 * ```
 */
export const authedMutation = customMutation(mutation, authInput);
