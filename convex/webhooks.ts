import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// HMAC-SHA256 signature for webhook verification
async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Deliver a webhook for a task assignment
export const deliver = internalAction({
  args: {
    taskId: v.string(),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Look up provider's webhook config
    const agent = await ctx.runQuery(internal.webhooks.getAgentWebhook, {
      agentId: args.providerId,
    });
    if (!agent?.webhook) return;

    // Check if events filter includes task.created (or no filter = all events)
    const events = agent.webhook.events;
    if (events && events.length > 0 && !events.includes("task.created")) return;

    // Look up the task
    const task = await ctx.runQuery(internal.webhooks.getTaskForWebhook, {
      taskId: args.taskId,
    });
    if (!task) return;

    // Create delivery record
    const deliveryId = await ctx.runMutation(internal.webhooks.createDelivery, {
      agentId: args.providerId,
      taskId: args.taskId,
      url: agent.webhook.url,
    });

    // Build payload
    const payload = JSON.stringify({
      event: "task.created",
      taskId: task.taskId,
      capability: task.capability,
      input: task.input,
      budget: task.budget,
      deadlineMs: task.deadlineMs,
      requesterId: task.requesterId,
      createdAt: task.createdAt,
    });

    const signature = await signPayload(payload, agent.webhook.secret);
    const timestamp = Date.now().toString();

    // Attempt delivery with retries
    let lastError: string | undefined;
    let responseStatus: number | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(agent.webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-FlintRoad-Signature": signature,
            "X-FlintRoad-Timestamp": timestamp,
            "X-FlintRoad-Event": "task.created",
            "X-FlintRoad-Delivery": deliveryId,
          },
          body: payload,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        responseStatus = res.status;

        if (res.ok) {
          await ctx.runMutation(internal.webhooks.updateDelivery, {
            deliveryId,
            status: "delivered",
            attempts: attempt,
            responseStatus,
          });
          return;
        }

        lastError = `HTTP ${res.status}`;
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Network error";
      }

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }

    // All attempts failed
    await ctx.runMutation(internal.webhooks.updateDelivery, {
      deliveryId,
      status: "failed",
      attempts: 3,
      responseStatus,
      error: lastError,
    });
  },
});

// --- Internal helpers ---

export const getAgentWebhook = internalQuery({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) return null;
    return { webhook: agent.webhook };
  },
});

export const getTaskForWebhook = internalQuery({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) return null;
    const { _id, _creationTime, ...rest } = task;
    return rest;
  },
});

export const createDelivery = internalMutation({
  args: {
    agentId: v.string(),
    taskId: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("webhookDeliveries", {
      agentId: args.agentId,
      taskId: args.taskId,
      url: args.url,
      status: "pending",
      attempts: 0,
      createdAt: Date.now(),
    });
    return id.toString();
  },
});

export const updateDelivery = internalMutation({
  args: {
    deliveryId: v.string(),
    status: v.union(v.literal("delivered"), v.literal("failed")),
    attempts: v.number(),
    responseStatus: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find delivery by scanning recent records (deliveryId is the _id string)
    const deliveries = await ctx.db.query("webhookDeliveries").order("desc").take(50);
    const delivery = deliveries.find((d) => d._id.toString() === args.deliveryId);
    if (!delivery) return;

    await ctx.db.patch(delivery._id, {
      status: args.status,
      attempts: args.attempts,
      lastAttemptAt: Date.now(),
      responseStatus: args.responseStatus,
      error: args.error,
    });
  },
});
