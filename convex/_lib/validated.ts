import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";
import { mutation, query } from "../_generated/server";
import { authInput } from "./authed";

/**
 * Public query builder with Zod argument validation.
 * No authentication required.
 *
 * @example
 * ```ts
 * export const list = zQuery({
 *   args: {
 *     limit: z.number().min(1).max(100),
 *     cursor: z.string().optional(),
 *   },
 *   handler: async (ctx, args) => {
 *     // args.limit is validated as a positive number <= 100
 *   },
 * });
 * ```
 */
export const zQuery = zCustomQuery(query, NoOp);

/**
 * Public mutation builder with Zod argument validation.
 * No authentication required.
 *
 * @example
 * ```ts
 * export const submit = zMutation({
 *   args: {
 *     email: z.string().email(),
 *     message: z.string().trim().min(1),
 *   },
 *   handler: async (ctx, args) => {
 *     await ctx.db.insert("contactMessages", args);
 *   },
 * });
 * ```
 */
export const zMutation = zCustomMutation(mutation, NoOp);

/**
 * Authenticated query builder with Zod argument validation.
 * Requires a signed-in user and adds `userId` to `ctx`.
 *
 * @example
 * ```ts
 * export const getBySlug = zAuthedQuery({
 *   args: { slug: z.string() },
 *   handler: async (ctx, args) => {
 *     // ctx.userId is the authenticated user's ID
 *   },
 * });
 * ```
 */
export const zAuthedQuery = zCustomQuery(query, authInput);

/**
 * Authenticated mutation builder with Zod argument validation.
 * Requires a signed-in user and adds `userId` to `ctx`.
 *
 * @example
 * ```ts
 * export const create = zAuthedMutation({
 *   args: {
 *     name: z.string().trim().min(1, "Name is required."),
 *     slug: z.string().trim().min(1, "Slug is required."),
 *   },
 *   handler: async (ctx, args) => {
 *     await ctx.db.insert("tags", { ...args, authorId: ctx.userId });
 *   },
 * });
 * ```
 */
export const zAuthedMutation = zCustomMutation(mutation, authInput);
