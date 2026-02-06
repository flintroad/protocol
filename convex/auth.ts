import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Hash an API key using SHA-256 (Web Crypto API)
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Uniform random selection from an alphabet using rejection sampling.
// Eliminates modular bias that occurs with `byte % length`.
function uniformRandomString(alphabet: string, length: number): string {
  const maxValid = 256 - (256 % alphabet.length); // Largest multiple of alphabet.length <= 256
  const result: string[] = [];
  while (result.length < length) {
    const bytes = new Uint8Array(length - result.length + 16); // Over-request to reduce loops
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < maxValid && result.length < length) {
        result.push(alphabet[b % alphabet.length]);
      }
    }
  }
  return result.join("");
}

// Generate a random API key (48 chars of entropy after prefix)
export function generateApiKey(): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return "fr_key_" + uniformRandomString(alphabet, 48);
}

// Generate a protocol ID with prefix (12 chars of entropy)
export function generateId(prefix: string): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  return prefix + "_" + uniformRandomString(alphabet, 12);
}

// Look up an API key by its hash
export const getByKeyHash = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", args.keyHash))
      .first();
  },
});

// Store a new API key record
export const createApiKey = internalMutation({
  args: { keyHash: v.string(), agentId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("apiKeys", {
      keyHash: args.keyHash,
      agentId: args.agentId,
      createdAt: Date.now(),
    });
  },
});

// Delete API keys for an agent
export const deleteKeysForAgent = internalMutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
    for (const key of keys) {
      await ctx.db.delete(key._id);
    }
  },
});

// --- Rate limiting ---

// In-memory rate limiter for HTTP actions (resets on cold start, which is fine).
// Keyed by IP address. Convex HTTP actions are stateless per-request, so we
// store the rate limit state in a module-level Map. This works because Convex
// functions within the same deployment share a V8 isolate across warm invocations.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodic cleanup to prevent memory leaks (called lazily)
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}
