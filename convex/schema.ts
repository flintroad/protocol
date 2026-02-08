import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    agentId: v.string(),
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
    status: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("busy")
    ),
    publicKey: v.optional(v.string()),
    webhook: v.optional(
      v.object({
        url: v.string(),
        secret: v.string(),
        events: v.optional(v.array(v.string())),
      })
    ),
    lastHeartbeat: v.number(),
    createdAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_status", ["status"])
    .searchIndex("search_capabilities", {
      searchField: "description",
      filterFields: ["status", "type"],
    }),

  apiKeys: defineTable({
    keyHash: v.string(),
    agentId: v.string(),
    createdAt: v.number(),
  })
    .index("by_keyHash", ["keyHash"])
    .index("by_agentId", ["agentId"]),

  tasks: defineTable({
    taskId: v.string(),
    requesterId: v.string(),
    providerId: v.optional(v.string()),
    capability: v.string(),
    type: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("timeout")
    ),
    input: v.any(),
    output: v.optional(v.any()),
    budget: v.optional(v.number()),
    agreedPrice: v.optional(v.number()),
    deadlineMs: v.optional(v.number()),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    failReason: v.optional(v.string()),
  })
    .index("by_taskId", ["taskId"])
    .index("by_providerId_status", ["providerId", "status"])
    .index("by_requesterId", ["requesterId"])
    .index("by_status", ["status"]),

  taskReceipts: defineTable({
    taskId: v.string(),
    providerId: v.string(),
    requesterId: v.string(),
    capability: v.string(),
    completedAt: v.number(),
    durationMs: v.number(),
    success: v.boolean(),
  }).index("by_providerId", ["providerId"]),

  reputationScores: defineTable({
    agentId: v.string(),
    completionRate: v.number(),
    avgResponseMs: v.number(),
    totalTasks: v.number(),
    successfulTasks: v.number(),
    score: v.number(),
    updatedAt: v.number(),
  }).index("by_agentId", ["agentId"]),

  capabilitySchemas: defineTable({
    name: v.string(),
    version: v.string(),
    description: v.optional(v.string()),
    inputSchema: v.optional(v.any()),
    outputSchema: v.optional(v.any()),
    registeredBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_registeredBy", ["registeredBy"]),

  bounties: defineTable({
    bountyId: v.string(),
    posterId: v.string(),
    capability: v.string(),
    title: v.string(),
    input: v.any(),
    budget: v.number(),
    entryFee: v.optional(v.number()),
    maxEntrants: v.number(),
    deadlineMs: v.number(),
    judgeType: v.union(
      v.literal("requester"),
      v.literal("automated"),
      v.literal("panel")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("judging"),
      v.literal("settled"),
      v.literal("cancelled")
    ),
    winnerId: v.optional(v.string()),
    protocolFee: v.optional(v.number()),
    createdAt: v.number(),
    settledAt: v.optional(v.number()),
  })
    .index("by_bountyId", ["bountyId"])
    .index("by_status", ["status"])
    .index("by_posterId", ["posterId"])
    .index("by_capability", ["capability"]),

  bountyEntries: defineTable({
    entryId: v.string(),
    bountyId: v.string(),
    agentId: v.string(),
    agentName: v.string(),
    output: v.optional(v.any()),
    submittedAt: v.optional(v.number()),
    score: v.optional(v.number()),
    rank: v.optional(v.number()),
    payout: v.optional(v.number()),
    status: v.union(
      v.literal("entered"),
      v.literal("submitted"),
      v.literal("won"),
      v.literal("lost")
    ),
    createdAt: v.number(),
  })
    .index("by_bountyId", ["bountyId"])
    .index("by_agentId", ["agentId"])
    .index("by_bountyId_agentId", ["bountyId", "agentId"]),

  webhookDeliveries: defineTable({
    agentId: v.string(),
    taskId: v.string(),
    url: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    attempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    responseStatus: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_taskId", ["taskId"]),
});
