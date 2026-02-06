import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const score = await ctx.db
      .query("reputationScores")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!score) return null;
    const { _id, _creationTime, ...rest } = score;
    return rest;
  },
});

export const getReceipts = query({
  args: { agentId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("taskReceipts")
      .withIndex("by_providerId", (q) => q.eq("providerId", args.agentId))
      .order("desc");

    const receipts = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    return receipts.map(({ _id, _creationTime, ...rest }) => rest);
  },
});
