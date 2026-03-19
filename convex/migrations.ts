import { Migrations } from "@convex-dev/migrations";
import { v } from "convex/values";
import { components, internal } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";
import { query } from "./_generated/server.js";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

/**
 * Get the status of migrations.
 * Use from CLI: bunx convex run --component migrations lib:getStatus --watch
 */
export const getStatus = migrations.getStatus;

/**
 * Cancel a running migration.
 * Use from CLI: bunx convex run --component migrations lib:cancel '{name: "migrations:backfillPostsPublishDate"}'
 */
export const cancel = migrations.cancel;

/**
 * Backfill publishDate for existing posts.
 * Sets publishDate to _creationTime if not already set.
 */
export const backfillPostsPublishDate = migrations.define({
	table: "posts",
	migrateOne: async (_ctx, doc) => {
		// If publishDate is not set, use _creationTime as default
		if (doc.publishDate === undefined || doc.publishDate === null) {
			return { publishDate: doc._creationTime };
		}
		// Already has publishDate, no change needed
		return undefined;
	},
});

/**
 * Backfill publishDate for existing projects.
 * Sets publishDate to _creationTime if not already set.
 */
export const backfillProjectsPublishDate = migrations.define({
	table: "projects",
	migrateOne: async (_ctx, doc) => {
		// If publishDate is not set, use _creationTime as default
		if (doc.publishDate === undefined || doc.publishDate === null) {
			return { publishDate: doc._creationTime };
		}
		// Already has publishDate, no change needed
		return undefined;
	},
});

/**
 * Run both migrations serially.
 * Can run either specific migration or both.
 */
export const runBackfillPublishDate = migrations.runner([
	internal.migrations.backfillProjectsPublishDate,
	internal.migrations.backfillPostsPublishDate,
]);

/**
 * Run all defined migrations serially.
 * Add new migrations to this list as needed.
 */
export const runAll = migrations.runner([
	internal.migrations.backfillProjectsPublishDate,
	internal.migrations.backfillPostsPublishDate,
]);

/**
 * Debug helper: Check how many documents need migration.
 */
export const checkPendingMigration = query({
	args: {
		table: v.union(v.literal("posts"), v.literal("projects")),
	},
	handler: async (ctx, args) => {
		const docs = await ctx.db.query(args.table).collect();
		const needsMigration = docs.filter(
			(doc) => doc.publishDate === undefined || doc.publishDate === null,
		);
		return {
			total: docs.length,
			needsMigration: needsMigration.length,
			alreadyMigrated: docs.length - needsMigration.length,
		};
	},
});
