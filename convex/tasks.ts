import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    requesterId: v.string(),
    providerId: v.optional(v.string()),
    capability: v.string(),
    type: v.optional(v.string()),
    input: v.any(),
    budget: v.optional(v.number()),
    deadlineMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { generateId } = await import("./auth.js");

    // Validate input size (rough check — Convex has a 1MB doc limit)
    const inputStr = JSON.stringify(args.input);
    if (inputStr.length > 102_400) {
      throw new Error("Task input too large (max 100KB)");
    }

    // Verify requester exists
    const requester = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.requesterId))
      .first();
    if (!requester) throw new Error("Requester agent not found");

    // If providerId specified, verify provider exists
    if (args.providerId) {
      const provider = await ctx.db
        .query("agents")
        .withIndex("by_agentId", (q) => q.eq("agentId", args.providerId!))
        .first();
      if (!provider) throw new Error("Provider agent not found");
    }

    // Validate capability/type lengths
    if (args.capability.length > 64)
      throw new Error("Capability too long (max 64)");
    if (args.type && args.type.length > 64)
      throw new Error("Type too long (max 64)");

    const taskId = generateId("fr_task");
    const now = Date.now();

    await ctx.db.insert("tasks", {
      taskId,
      requesterId: args.requesterId,
      providerId: args.providerId,
      capability: args.capability,
      type: args.type,
      status: "pending",
      input: args.input,
      budget: args.budget,
      deadlineMs: args.deadlineMs,
      createdAt: now,
    });

    return { taskId };
  },
});

export const accept = internalMutation({
  args: {
    taskId: v.string(),
    providerId: v.string(),
    agreedPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) throw new Error("Task not found");
    if (task.status !== "pending") {
      throw new Error(`Cannot accept task in status: ${task.status}`);
    }

    // If task has a specific provider, verify it matches
    if (task.providerId && task.providerId !== args.providerId) {
      throw new Error("Task is assigned to a different provider");
    }

    // Verify the accepting agent exists
    const provider = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.providerId))
      .first();
    if (!provider) throw new Error("Provider agent not found");

    await ctx.db.patch(task._id, {
      providerId: args.providerId,
      status: "accepted",
      agreedPrice: args.agreedPrice,
      acceptedAt: Date.now(),
    });

    return { success: true };
  },
});

export const complete = internalMutation({
  args: {
    taskId: v.string(),
    providerId: v.string(),
    output: v.any(),
  },
  handler: async (ctx, args) => {
    // Validate output size
    const outputStr = JSON.stringify(args.output);
    if (outputStr.length > 102_400) {
      throw new Error("Task output too large (max 100KB)");
    }

    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) throw new Error("Task not found");
    if (task.status !== "accepted" && task.status !== "in_progress") {
      throw new Error(`Cannot complete task in status: ${task.status}`);
    }
    if (task.providerId !== args.providerId) {
      throw new Error("Only the assigned provider can complete this task");
    }

    const now = Date.now();
    const durationMs = now - task.createdAt;

    await ctx.db.patch(task._id, {
      status: "completed",
      output: args.output,
      completedAt: now,
    });

    // Create task receipt
    await ctx.db.insert("taskReceipts", {
      taskId: args.taskId,
      providerId: args.providerId,
      requesterId: task.requesterId,
      capability: task.capability,
      completedAt: now,
      durationMs,
      success: true,
    });

    // Incremental reputation update
    await incrementReputation(ctx, args.providerId, durationMs, true);

    return { success: true };
  },
});

export const fail = internalMutation({
  args: {
    taskId: v.string(),
    callerAgentId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) throw new Error("Task not found");

    if (
      task.status !== "pending" &&
      task.status !== "accepted" &&
      task.status !== "in_progress"
    ) {
      throw new Error(`Cannot fail task in status: ${task.status}`);
    }

    // Authorization: only the assigned provider OR the requester can fail
    const isProvider = task.providerId === args.callerAgentId;
    const isRequester = task.requesterId === args.callerAgentId;
    if (!isProvider && !isRequester) {
      throw new Error("Only the requester or assigned provider can fail a task");
    }

    const now = Date.now();
    const durationMs = now - task.createdAt;

    await ctx.db.patch(task._id, {
      status: "failed",
      failReason: args.reason?.slice(0, 1024),
      completedAt: now,
    });

    // Only create receipt + impact reputation if a provider was assigned
    if (task.providerId) {
      await ctx.db.insert("taskReceipts", {
        taskId: args.taskId,
        providerId: task.providerId,
        requesterId: task.requesterId,
        capability: task.capability,
        completedAt: now,
        durationMs,
        success: false,
      });

      await incrementReputation(ctx, task.providerId, durationMs, false);
    }

    return { success: true };
  },
});

// Access-controlled task read — only requester or provider can see full details
export const get = internalQuery({
  args: { taskId: v.string(), callerAgentId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) return null;

    // Only requester or provider can see the task
    if (
      task.requesterId !== args.callerAgentId &&
      task.providerId !== args.callerAgentId
    ) {
      return null; // Return null, not error — don't reveal task existence
    }

    const { _id, _creationTime, ...rest } = task;
    return rest;
  },
});

// Access-controlled task list — only returns caller's own tasks
export const list = internalQuery({
  args: {
    callerAgentId: v.string(),
    role: v.optional(
      v.union(v.literal("requester"), v.literal("provider"))
    ),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("timeout")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    let results;

    if (args.role === "provider" && args.status) {
      results = await ctx.db
        .query("tasks")
        .withIndex("by_providerId_status", (q) =>
          q
            .eq("providerId", args.callerAgentId)
            .eq("status", args.status!)
        )
        .take(limit);
    } else if (args.role === "provider") {
      results = await ctx.db
        .query("tasks")
        .withIndex("by_providerId_status", (q) =>
          q.eq("providerId", args.callerAgentId)
        )
        .take(limit);
    } else if (args.role === "requester") {
      results = await ctx.db
        .query("tasks")
        .withIndex("by_requesterId", (q) =>
          q.eq("requesterId", args.callerAgentId)
        )
        .take(limit);
    } else {
      // Both roles — union of requester + provider tasks
      const asRequester = await ctx.db
        .query("tasks")
        .withIndex("by_requesterId", (q) =>
          q.eq("requesterId", args.callerAgentId)
        )
        .take(limit);
      const asProvider = await ctx.db
        .query("tasks")
        .withIndex("by_providerId_status", (q) =>
          q.eq("providerId", args.callerAgentId)
        )
        .take(limit);
      // Deduplicate
      const seen = new Set<string>();
      results = [];
      for (const t of [...asRequester, ...asProvider]) {
        if (!seen.has(t.taskId)) {
          seen.add(t.taskId);
          results.push(t);
        }
      }
      results = results.slice(0, limit);
    }

    // Apply status filter if not already handled by index
    if (args.status && args.role !== "provider") {
      results = results.filter((t) => t.status === args.status);
    }

    return results.map(({ _id, _creationTime, ...rest }) => rest);
  },
});

// Reactive query: providers subscribe to get incoming tasks in real-time
// This remains a public query — the providerId scopes it to the caller's own tasks
export const getIncoming = internalQuery({
  args: { providerId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_providerId_status", (q) =>
        q.eq("providerId", args.providerId).eq("status", "pending")
      )
      .take(50);
    return tasks.map(({ _id, _creationTime, ...rest }) => rest);
  },
});

// Reactive query: watch a specific task for status changes
export const watch = internalQuery({
  args: { taskId: v.string(), callerAgentId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) return null;

    // Only requester or provider can watch
    if (
      task.requesterId !== args.callerAgentId &&
      task.providerId !== args.callerAgentId
    ) {
      return null;
    }

    const { _id, _creationTime, ...rest } = task;
    return rest;
  },
});

// Incremental reputation update — O(1) instead of O(n)
async function incrementReputation(
  ctx: { db: any },
  providerId: string,
  durationMs: number,
  success: boolean
) {
  const existing = await ctx.db
    .query("reputationScores")
    .withIndex("by_agentId", (q: any) => q.eq("agentId", providerId))
    .first();

  if (!existing) {
    await ctx.db.insert("reputationScores", {
      agentId: providerId,
      completionRate: success ? 1.0 : 0.0,
      avgResponseMs: durationMs,
      totalTasks: 1,
      successfulTasks: success ? 1 : 0,
      score: success ? 0.7 : 0.0,
      updatedAt: Date.now(),
    });
    return;
  }

  const newTotal = existing.totalTasks + 1;
  const newSuccessful = existing.successfulTasks + (success ? 1 : 0);
  const completionRate = newSuccessful / newTotal;

  // Running average for response time
  const avgResponseMs =
    (existing.avgResponseMs * existing.totalTasks + durationMs) / newTotal;

  // Composite score
  const speedScore = Math.max(0, 1 - avgResponseMs / 3_600_000);
  const score = completionRate * 0.7 + speedScore * 0.3;

  await ctx.db.patch(existing._id, {
    completionRate,
    avgResponseMs,
    totalTasks: newTotal,
    successfulTasks: newSuccessful,
    score: Math.round(score * 1000) / 1000,
    updatedAt: Date.now(),
  });
}
