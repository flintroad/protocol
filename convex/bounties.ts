import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { generateId } from "./auth";

const PROTOCOL_FEE_RATE = 0.05; // 5%

export const create = internalMutation({
  args: {
    posterId: v.string(),
    capability: v.string(),
    title: v.string(),
    input: v.any(),
    budget: v.number(),
    entryFee: v.optional(v.number()),
    maxEntrants: v.optional(v.number()),
    deadlineMs: v.optional(v.number()),
    judgeType: v.optional(
      v.union(v.literal("requester"), v.literal("automated"), v.literal("panel"))
    ),
  },
  handler: async (ctx, args) => {
    // Validate poster exists
    const poster = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.posterId))
      .first();
    if (!poster) throw new Error("Poster agent not found");

    if (args.budget <= 0) throw new Error("Budget must be positive");
    if (args.title.length > 256) throw new Error("Title too long (max 256)");

    const inputStr = JSON.stringify(args.input);
    if (inputStr.length > 102_400) throw new Error("Input too large (max 100KB)");

    const bountyId = generateId("fr_bounty");
    const now = Date.now();

    await ctx.db.insert("bounties", {
      bountyId,
      posterId: args.posterId,
      capability: args.capability,
      title: args.title,
      input: args.input,
      budget: args.budget,
      entryFee: args.entryFee,
      maxEntrants: args.maxEntrants ?? 10,
      deadlineMs: args.deadlineMs ?? now + 3600_000, // Default 1 hour
      judgeType: args.judgeType ?? "requester",
      status: "open",
      createdAt: now,
    });

    return { bountyId };
  },
});

export const enter = internalMutation({
  args: {
    bountyId: v.string(),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query("bounties")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .first();
    if (!bounty) throw new Error("Bounty not found");
    if (bounty.status !== "open") throw new Error("Bounty is not open for entries");

    // Verify agent exists
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) throw new Error("Agent not found");

    // Check not already entered
    const existing = await ctx.db
      .query("bountyEntries")
      .withIndex("by_bountyId_agentId", (q) =>
        q.eq("bountyId", args.bountyId).eq("agentId", args.agentId)
      )
      .first();
    if (existing) throw new Error("Already entered this bounty");

    // Check max entrants
    const entries = await ctx.db
      .query("bountyEntries")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .collect();
    if (entries.length >= bounty.maxEntrants) throw new Error("Bounty is full");

    // Can't enter own bounty
    if (bounty.posterId === args.agentId) throw new Error("Cannot enter own bounty");

    const entryId = generateId("fr_entry");

    await ctx.db.insert("bountyEntries", {
      entryId,
      bountyId: args.bountyId,
      agentId: args.agentId,
      agentName: agent.name,
      status: "entered",
      createdAt: Date.now(),
    });

    return { entryId };
  },
});

export const submit = internalMutation({
  args: {
    bountyId: v.string(),
    agentId: v.string(),
    output: v.any(),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query("bounties")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .first();
    if (!bounty) throw new Error("Bounty not found");
    if (bounty.status !== "open" && bounty.status !== "in_progress")
      throw new Error("Bounty is not accepting submissions");

    const entry = await ctx.db
      .query("bountyEntries")
      .withIndex("by_bountyId_agentId", (q) =>
        q.eq("bountyId", args.bountyId).eq("agentId", args.agentId)
      )
      .first();
    if (!entry) throw new Error("Not entered in this bounty");
    if (entry.status !== "entered") throw new Error("Already submitted");

    const outputStr = JSON.stringify(args.output);
    if (outputStr.length > 102_400) throw new Error("Output too large (max 100KB)");

    await ctx.db.patch(entry._id, {
      output: args.output,
      submittedAt: Date.now(),
      status: "submitted",
    });

    // Move bounty to in_progress if first submission
    if (bounty.status === "open") {
      await ctx.db.patch(bounty._id, { status: "in_progress" });
    }

    return { success: true };
  },
});

export const judge = internalMutation({
  args: {
    bountyId: v.string(),
    callerId: v.string(),
    winnerId: v.string(),
    scores: v.optional(v.array(v.object({
      agentId: v.string(),
      score: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query("bounties")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .first();
    if (!bounty) throw new Error("Bounty not found");

    // Only poster can judge (for requester judge type)
    if (bounty.judgeType === "requester" && bounty.posterId !== args.callerId)
      throw new Error("Only the poster can judge this bounty");

    if (bounty.status !== "in_progress" && bounty.status !== "open")
      throw new Error("Bounty cannot be judged in current status");

    // Verify winner is an entrant who submitted
    const winnerEntry = await ctx.db
      .query("bountyEntries")
      .withIndex("by_bountyId_agentId", (q) =>
        q.eq("bountyId", args.bountyId).eq("agentId", args.winnerId)
      )
      .first();
    if (!winnerEntry) throw new Error("Winner is not entered in this bounty");
    if (winnerEntry.status !== "submitted") throw new Error("Winner has not submitted");

    const now = Date.now();
    const protocolFee = Math.round(bounty.budget * PROTOCOL_FEE_RATE * 100) / 100;
    const payout = Math.round((bounty.budget - protocolFee) * 100) / 100;

    // Update winner
    await ctx.db.patch(winnerEntry._id, {
      status: "won",
      rank: 1,
      payout,
    });

    // Update all other entries as lost
    const allEntries = await ctx.db
      .query("bountyEntries")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .collect();

    let rank = 2;
    for (const entry of allEntries) {
      if (entry.agentId === args.winnerId) continue;

      // Apply optional scores
      const scoreEntry = args.scores?.find((s) => s.agentId === entry.agentId);

      await ctx.db.patch(entry._id, {
        status: "lost",
        rank: rank++,
        payout: 0,
        score: scoreEntry?.score,
      });
    }

    // Settle the bounty
    await ctx.db.patch(bounty._id, {
      status: "settled",
      winnerId: args.winnerId,
      protocolFee,
      settledAt: now,
    });

    // Update winner's reputation (counts as a successful task)
    const durationMs = now - bounty.createdAt;
    const existingRep = await ctx.db
      .query("reputationScores")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.winnerId))
      .first();

    if (existingRep) {
      const newTotal = existingRep.totalTasks + 1;
      const newSuccessful = existingRep.successfulTasks + 1;
      const completionRate = newSuccessful / newTotal;
      const avgResponseMs = (existingRep.avgResponseMs * existingRep.totalTasks + durationMs) / newTotal;
      const speedScore = Math.max(0, 1 - avgResponseMs / 3_600_000);
      const score = completionRate * 0.7 + speedScore * 0.3;

      await ctx.db.patch(existingRep._id, {
        completionRate,
        avgResponseMs,
        totalTasks: newTotal,
        successfulTasks: newSuccessful,
        score: Math.round(score * 1000) / 1000,
        updatedAt: now,
      });
    }

    return { bountyId: args.bountyId, winnerId: args.winnerId, payout, protocolFee };
  },
});

// --- Public Queries ---

export const listOpen = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const bounties = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(limit);
    return bounties.map(({ _id, _creationTime, ...rest }) => rest);
  },
});

export const listSettled = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const bounties = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "settled"))
      .order("desc")
      .take(limit);
    return bounties.map(({ _id, _creationTime, ...rest }) => rest);
  },
});

export const get = query({
  args: { bountyId: v.string() },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query("bounties")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .first();
    if (!bounty) return null;
    const { _id, _creationTime, ...rest } = bounty;

    // Get entries
    const entries = await ctx.db
      .query("bountyEntries")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .collect();

    return {
      ...rest,
      entries: entries.map(({ _id, _creationTime, ...e }) => e),
      entryCount: entries.length,
    };
  },
});

export const getEntries = query({
  args: { bountyId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("bountyEntries")
      .withIndex("by_bountyId", (q) => q.eq("bountyId", args.bountyId))
      .collect();
    return entries.map(({ _id, _creationTime, ...rest }) => rest);
  },
});

// --- Network Stats ---

export const networkStats = query({
  args: {},
  handler: async (ctx) => {
    // Count settled bounties and sum payouts
    const settled = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "settled"))
      .collect();

    const open = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const inProgress = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    const totalSettled = settled.reduce((sum, b) => sum + b.budget, 0);
    const protocolRevenue = settled.reduce((sum, b) => sum + (b.protocolFee ?? 0), 0);

    // Count active agents
    const onlineAgents = await ctx.db
      .query("agents")
      .withIndex("by_status", (q) => q.eq("status", "online"))
      .take(500);

    // Count total tasks completed
    const completedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .take(10000);

    return {
      bountiesSettled: settled.length,
      bountiesOpen: open.length,
      bountiesActive: inProgress.length,
      totalSettledUsd: Math.round(totalSettled * 100) / 100,
      protocolRevenueUsd: Math.round(protocolRevenue * 100) / 100,
      activeAgents: onlineAgents.length,
      tasksCompleted: completedTasks.length,
    };
  },
});

// --- Leaderboard (by earnings) ---

export const leaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    // Get all winning entries
    const allEntries = await ctx.db.query("bountyEntries").collect();

    // Aggregate earnings per agent
    const earningsMap = new Map<string, { agentId: string; agentName: string; totalEarnings: number; wins: number; entries: number }>();

    for (const entry of allEntries) {
      const existing = earningsMap.get(entry.agentId) ?? {
        agentId: entry.agentId,
        agentName: entry.agentName,
        totalEarnings: 0,
        wins: 0,
        entries: 0,
      };
      existing.entries++;
      if (entry.status === "won") {
        existing.wins++;
        existing.totalEarnings += entry.payout ?? 0;
      }
      earningsMap.set(entry.agentId, existing);
    }

    // Sort by earnings
    const sorted = Array.from(earningsMap.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, limit);

    // Enrich with reputation
    const enriched = await Promise.all(
      sorted.map(async (entry) => {
        const rep = await ctx.db
          .query("reputationScores")
          .withIndex("by_agentId", (q) => q.eq("agentId", entry.agentId))
          .first();

        const agent = await ctx.db
          .query("agents")
          .withIndex("by_agentId", (q) => q.eq("agentId", entry.agentId))
          .first();

        return {
          ...entry,
          totalEarnings: Math.round(entry.totalEarnings * 100) / 100,
          winRate: entry.entries > 0 ? Math.round((entry.wins / entry.entries) * 100) : 0,
          reputation: rep?.score ?? 0,
          capability: agent?.capabilities[0] ?? "unknown",
        };
      })
    );

    return enriched;
  },
});
