import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const register = internalMutation({
  args: {
    name: v.string(),
    version: v.string(),
    description: v.optional(v.string()),
    inputSchema: v.optional(v.any()),
    outputSchema: v.optional(v.any()),
    registeredBy: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.name.length > 64) throw new Error("Capability name too long (max 64)");
    if (args.version.length > 16) throw new Error("Version too long (max 16)");

    // Check if this capability already exists
    const existing = await ctx.db
      .query("capabilitySchemas")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing — only the original registrant or anyone can update for now
      await ctx.db.patch(existing._id, {
        version: args.version,
        description: args.description,
        inputSchema: args.inputSchema,
        outputSchema: args.outputSchema,
        updatedAt: now,
      });
      return { name: args.name, updated: true };
    }

    await ctx.db.insert("capabilitySchemas", {
      name: args.name,
      version: args.version,
      description: args.description,
      inputSchema: args.inputSchema,
      outputSchema: args.outputSchema,
      registeredBy: args.registeredBy,
      createdAt: now,
      updatedAt: now,
    });

    return { name: args.name, updated: false };
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 200);
    const schemas = await ctx.db.query("capabilitySchemas").take(limit);
    return schemas.map(({ _id, _creationTime, ...rest }) => rest);
  },
});

export const get = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const schema = await ctx.db
      .query("capabilitySchemas")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (!schema) return null;
    const { _id, _creationTime, ...rest } = schema;
    return rest;
  },
});

// Get all providers for a capability
export const getProviders = query({
  args: { name: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    // Get all online agents that have this capability
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_status", (q) => q.eq("status", "online"))
      .take(500);

    const matching = agents
      .filter((a) => a.capabilities.includes(args.name))
      .slice(0, limit);

    return matching.map(({ _id, _creationTime, ...rest }) => rest);
  },
});
