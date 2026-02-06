import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { generateId, generateApiKey, hashApiKey } from "./auth";

export const register = internalMutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("machine"), v.literal("human")),
    capabilities: v.array(v.string()),
    description: v.optional(v.string()),
    endpoint: v.optional(v.string()),
    pricing: v.optional(
      v.object({
        basePrice: v.number(),
        currency: v.string(),
      })
    ),
    infrastructure: v.optional(
      v.object({
        runtime: v.optional(v.string()),
        platform: v.optional(v.string()),
        region: v.optional(v.string()),
        hasBrowser: v.optional(v.boolean()),
        uptimeSla: v.optional(v.number()),
      })
    ),
    publicKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agentId = generateId("fr_agent");
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);

    const now = Date.now();

    // Enforce name length
    if (args.name.length > 128) throw new Error("Name too long (max 128)");
    if (args.capabilities.length > 32)
      throw new Error("Too many capabilities (max 32)");
    for (const cap of args.capabilities) {
      if (cap.length > 64) throw new Error("Capability name too long (max 64)");
    }

    await ctx.db.insert("agents", {
      agentId,
      name: args.name,
      type: args.type,
      capabilities: args.capabilities,
      description:
        args.description?.slice(0, 512) ??
        `${args.name} — ${args.capabilities.join(", ")}`.slice(0, 512),
      endpoint: args.endpoint?.slice(0, 2048),
      pricing: args.pricing,
      infrastructure: args.infrastructure,
      publicKey: args.publicKey,
      status: "online",
      lastHeartbeat: now,
      createdAt: now,
    });

    await ctx.db.insert("apiKeys", {
      keyHash,
      agentId,
      createdAt: now,
    });

    // Initialize reputation
    await ctx.db.insert("reputationScores", {
      agentId,
      completionRate: 1.0,
      avgResponseMs: 0,
      totalTasks: 0,
      successfulTasks: 0,
      score: 0.5,
      updatedAt: now,
    });

    return { agentId, apiKey };
  },
});

export const get = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) return null;
    const { _id, _creationTime, ...rest } = agent;
    return rest;
  },
});

export const search = query({
  args: {
    capability: v.optional(v.string()),
    type: v.optional(v.union(v.literal("machine"), v.literal("human"))),
    maxPrice: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("online"), v.literal("offline"), v.literal("busy"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);

    let results: Doc<"agents">[];

    if (args.capability) {
      // Use search index for text-based discovery
      const searchResults = await ctx.db
        .query("agents")
        .withSearchIndex("search_capabilities", (q) => {
          let s = q.search("description", args.capability!);
          if (args.status) s = s.eq("status", args.status);
          if (args.type) s = s.eq("type", args.type);
          return s;
        })
        .take(limit);

      // Supplement with exact capability matches not in search results
      const exactMatches = await ctx.db
        .query("agents")
        .withIndex("by_status", (q) =>
          args.status ? q.eq("status", args.status) : q
        )
        .take(500);

      const searchIds = new Set(searchResults.map((r) => r.agentId));
      const filtered = exactMatches.filter(
        (a) =>
          a.capabilities.includes(args.capability!) &&
          !searchIds.has(a.agentId)
      );
      results = [...searchResults, ...filtered].slice(0, limit);
    } else {
      // No capability specified — list agents with pagination
      if (args.status) {
        results = await ctx.db
          .query("agents")
          .withIndex("by_status", (qi) => qi.eq("status", args.status!))
          .take(limit);
      } else {
        results = await ctx.db.query("agents").take(limit);
      }
    }

    // Apply remaining filters
    if (args.type && !args.capability) {
      results = results.filter((a) => a.type === args.type);
    }
    if (args.maxPrice !== undefined) {
      results = results.filter(
        (a) => !a.pricing || a.pricing.basePrice <= args.maxPrice!
      );
    }

    return results.map(({ _id, _creationTime, ...rest }) => rest);
  },
});

export const update = internalMutation({
  args: {
    agentId: v.string(),
    callerAgentId: v.string(),
    name: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    endpoint: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("online"), v.literal("offline"), v.literal("busy"))
    ),
    pricing: v.optional(
      v.object({
        basePrice: v.number(),
        currency: v.string(),
      })
    ),
    infrastructure: v.optional(
      v.object({
        runtime: v.optional(v.string()),
        platform: v.optional(v.string()),
        region: v.optional(v.string()),
        hasBrowser: v.optional(v.boolean()),
        uptimeSla: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.callerAgentId !== args.agentId) {
      throw new Error("Forbidden: can only update own agent");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) throw new Error("Agent not found");

    // Validate inputs
    if (args.name !== undefined && args.name.length > 128)
      throw new Error("Name too long");
    if (args.capabilities !== undefined && args.capabilities.length > 32)
      throw new Error("Too many capabilities");
    if (args.description !== undefined && args.description.length > 512)
      throw new Error("Description too long");

    const updates: Record<string, unknown> = {
      lastHeartbeat: Date.now(),
    };
    if (args.name !== undefined) updates.name = args.name;
    if (args.capabilities !== undefined)
      updates.capabilities = args.capabilities;
    if (args.description !== undefined) updates.description = args.description;
    if (args.endpoint !== undefined)
      updates.endpoint = args.endpoint.slice(0, 2048);
    if (args.status !== undefined) updates.status = args.status;
    if (args.pricing !== undefined) updates.pricing = args.pricing;
    if (args.infrastructure !== undefined)
      updates.infrastructure = args.infrastructure;

    await ctx.db.patch(agent._id, updates);

    return { success: true };
  },
});

export const remove = internalMutation({
  args: { agentId: v.string(), callerAgentId: v.string() },
  handler: async (ctx, args) => {
    if (args.callerAgentId !== args.agentId) {
      throw new Error("Forbidden: can only delete own agent");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) throw new Error("Agent not found");

    // Delete API keys
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
    for (const key of keys) {
      await ctx.db.delete(key._id);
    }

    // Delete reputation
    const rep = await ctx.db
      .query("reputationScores")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (rep) await ctx.db.delete(rep._id);

    await ctx.db.delete(agent._id);

    return { success: true };
  },
});
