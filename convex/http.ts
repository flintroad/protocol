import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { hashApiKey, checkRateLimit, cleanupRateLimits } from "./auth";

const http = httpRouter();

// --- Helpers ---

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

// Sanitize error messages — never leak internal details
function safeErrorMessage(e: unknown, fallback: string): string {
  if (!(e instanceof Error)) return fallback;
  // Allow known application errors through
  const safePatterns = [
    "not found",
    "Unauthorized",
    "Forbidden",
    "too long",
    "too large",
    "Too many",
    "Cannot",
    "Only the",
    "assigned to a different",
    "No providers",
  ];
  for (const pattern of safePatterns) {
    if (e.message.includes(pattern)) return e.message;
  }
  return fallback;
}

async function authenticateRequest(
  ctx: { runQuery: any },
  request: Request
): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);

  // Basic key format validation
  if (!apiKey.startsWith("fr_key_") || apiKey.length !== 55) return null;

  const keyHash = await hashApiKey(apiKey);
  const keyRecord = await ctx.runQuery(internal.auth.getByKeyHash, { keyHash });
  return keyRecord?.agentId ?? null;
}

function getClientIP(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function extractPathSegment(url: string, prefix: string): string {
  const segment = new URL(url).pathname.slice(prefix.length).split("/")[0];
  // Validate it looks like a flintroad ID
  if (segment && !/^fr_[a-z]+_[a-z0-9]+$/.test(segment)) return "";
  return segment;
}

function extractSubPath(url: string, prefix: string): string[] {
  return new URL(url).pathname.slice(prefix.length).split("/").filter(Boolean);
}

// --- Rate limiting helper ---
async function rateLimit(
  request: Request,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  // Lazy cleanup every ~100 requests
  if (Math.random() < 0.01) cleanupRateLimits();
  const ip = getClientIP(request);
  return checkRateLimit(ip, maxRequests, windowMs);
}

// --- CORS ---

const corsHandler = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
});

// --- Health ---

const healthCheck = httpAction(async () => {
  return jsonResponse({
    status: "ok",
    protocol: "flint",
    service: "flintroad",
    version: "0.1.0",
  });
});

// --- Agents ---

const createAgent = httpAction(async (ctx, request) => {
  // Strict rate limit on registration: 5 per minute per IP
  if (!(await rateLimit(request, 5, 60_000))) {
    return errorResponse("Rate limit exceeded", 429);
  }

  try {
    const body = await request.json();

    // Explicitly pick allowed fields — never spread raw input
    const result = await ctx.runMutation(internal.agents.register, {
      name: body.name,
      type: body.type,
      capabilities: body.capabilities,
      description: body.description,
      endpoint: body.endpoint,
      pricing: body.pricing,
      infrastructure: body.infrastructure,
      publicKey: body.publicKey,
    });
    return jsonResponse(result, 201);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Registration failed"), 400);
  }
});

const searchAgents = httpAction(async (ctx, request) => {
  // Rate limit search: 60 per minute per IP
  if (!(await rateLimit(request, 60, 60_000))) {
    return errorResponse("Rate limit exceeded", 429);
  }

  const url = new URL(request.url);
  const capability = url.searchParams.get("capability") ?? undefined;
  const type = url.searchParams.get("type") as any;
  const maxPriceStr = url.searchParams.get("maxPrice");
  const status = url.searchParams.get("status") as any;
  const limitStr = url.searchParams.get("limit");

  try {
    const results = await ctx.runQuery(api.agents.search, {
      capability,
      type: type || undefined,
      maxPrice: maxPriceStr ? parseFloat(maxPriceStr) : undefined,
      status: status || undefined,
      limit: limitStr ? parseInt(limitStr, 10) : undefined,
    });
    return jsonResponse(results);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Search failed"), 400);
  }
});

const getAgent = httpAction(async (ctx, request) => {
  const agentId = extractPathSegment(request.url, "/v1/agents/");
  if (!agentId) return errorResponse("Invalid agent ID", 400);

  const agent = await ctx.runQuery(api.agents.get, { agentId });
  if (!agent) return errorResponse("Agent not found", 404);
  return jsonResponse(agent);
});

const updateAgent = httpAction(async (ctx, request) => {
  const agentId = extractPathSegment(request.url, "/v1/agents/");
  if (!agentId) return errorResponse("Invalid agent ID", 400);

  const callerId = await authenticateRequest(ctx, request);
  if (!callerId) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();

    // Explicitly pick allowed fields
    const result = await ctx.runMutation(internal.agents.update, {
      agentId,
      callerAgentId: callerId,
      name: body.name,
      capabilities: body.capabilities,
      description: body.description,
      endpoint: body.endpoint,
      status: body.status,
      pricing: body.pricing,
      infrastructure: body.infrastructure,
    });
    return jsonResponse(result);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Update failed"), 400);
  }
});

const deleteAgent = httpAction(async (ctx, request) => {
  const agentId = extractPathSegment(request.url, "/v1/agents/");
  if (!agentId) return errorResponse("Invalid agent ID", 400);

  const callerId = await authenticateRequest(ctx, request);
  if (!callerId) return errorResponse("Unauthorized", 401);

  try {
    const result = await ctx.runMutation(internal.agents.remove, {
      agentId,
      callerAgentId: callerId,
    });
    return jsonResponse(result);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Delete failed"), 400);
  }
});

// --- Tasks ---

const createTask = httpAction(async (ctx, request) => {
  const callerId = await authenticateRequest(ctx, request);
  if (!callerId) return errorResponse("Unauthorized", 401);

  // Rate limit task creation: 30 per minute per agent
  if (!(await rateLimit(request, 30, 60_000))) {
    return errorResponse("Rate limit exceeded", 429);
  }

  try {
    const body = await request.json();

    const result = await ctx.runMutation(internal.tasks.create, {
      requesterId: callerId,
      providerId: body.providerId,
      capability: body.capability,
      type: body.type,
      input: body.input,
      budget: body.budget,
      deadlineMs: body.deadlineMs,
    });
    return jsonResponse(result, 201);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Task creation failed"), 400);
  }
});

const listTasks = httpAction(async (ctx, request) => {
  const callerId = await authenticateRequest(ctx, request);
  if (!callerId) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const role = url.searchParams.get("role") as any;
  const status = url.searchParams.get("status") as any;
  const limitStr = url.searchParams.get("limit");

  try {
    const results = await ctx.runQuery(internal.tasks.list, {
      callerAgentId: callerId,
      role: role || undefined,
      status: status || undefined,
      limit: limitStr ? parseInt(limitStr, 10) : undefined,
    });
    return jsonResponse(results);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "List failed"), 400);
  }
});

const getTask = httpAction(async (ctx, request) => {
  const segments = extractSubPath(request.url, "/v1/tasks/");
  const taskId = segments[0];
  if (!taskId) return errorResponse("Missing task ID", 400);

  const callerId = await authenticateRequest(ctx, request);
  if (!callerId) return errorResponse("Unauthorized", 401);

  const task = await ctx.runQuery(internal.tasks.get, {
    taskId,
    callerAgentId: callerId,
  });
  if (!task) return errorResponse("Task not found", 404);
  return jsonResponse(task);
});

const taskAction = httpAction(async (ctx, request) => {
  const segments = extractSubPath(request.url, "/v1/tasks/");
  const taskId = segments[0];
  const action = segments[1];

  if (!taskId || !action) {
    return errorResponse("Invalid task action path", 400);
  }

  // Validate action is one of the known values
  if (!["accept", "complete", "fail"].includes(action)) {
    return errorResponse("Unknown action", 400);
  }

  const callerId = await authenticateRequest(ctx, request);
  if (!callerId) return errorResponse("Unauthorized", 401);

  try {
    let result;
    switch (action) {
      case "accept": {
        const body = await request.json().catch(() => ({}));
        result = await ctx.runMutation(internal.tasks.accept, {
          taskId,
          providerId: callerId,
          agreedPrice: body.agreedPrice,
        });
        break;
      }
      case "complete": {
        const body = await request.json();
        result = await ctx.runMutation(internal.tasks.complete, {
          taskId,
          providerId: callerId,
          output: body.output,
        });
        break;
      }
      case "fail": {
        const body = await request.json().catch(() => ({}));
        result = await ctx.runMutation(internal.tasks.fail, {
          taskId,
          callerAgentId: callerId,
          reason: body.reason,
        });
        break;
      }
    }
    return jsonResponse(result);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Action failed"), 400);
  }
});

// --- Reputation ---

const getReputation = httpAction(async (ctx, request) => {
  const agentId = extractPathSegment(request.url, "/v1/reputation/");
  if (!agentId) return errorResponse("Invalid agent ID", 400);

  const score = await ctx.runQuery(api.reputation.get, { agentId });
  if (!score) return errorResponse("No reputation data", 404);
  return jsonResponse(score);
});

// --- Route registration ---

// CORS preflight for all routes
http.route({ path: "/health", method: "OPTIONS", handler: corsHandler });
http.route({ path: "/v1/agents", method: "OPTIONS", handler: corsHandler });
http.route({
  pathPrefix: "/v1/agents/",
  method: "OPTIONS",
  handler: corsHandler,
});
http.route({ path: "/v1/tasks", method: "OPTIONS", handler: corsHandler });
http.route({
  pathPrefix: "/v1/tasks/",
  method: "OPTIONS",
  handler: corsHandler,
});
http.route({
  pathPrefix: "/v1/reputation/",
  method: "OPTIONS",
  handler: corsHandler,
});

// Health
http.route({ path: "/health", method: "GET", handler: healthCheck });

// Agents
http.route({ path: "/v1/agents", method: "POST", handler: createAgent });
http.route({ path: "/v1/agents", method: "GET", handler: searchAgents });
http.route({
  pathPrefix: "/v1/agents/",
  method: "GET",
  handler: getAgent,
});
http.route({
  pathPrefix: "/v1/agents/",
  method: "PATCH",
  handler: updateAgent,
});
http.route({
  pathPrefix: "/v1/agents/",
  method: "DELETE",
  handler: deleteAgent,
});

// Tasks
http.route({ path: "/v1/tasks", method: "POST", handler: createTask });
http.route({ path: "/v1/tasks", method: "GET", handler: listTasks });
http.route({ pathPrefix: "/v1/tasks/", method: "GET", handler: getTask });
http.route({
  pathPrefix: "/v1/tasks/",
  method: "POST",
  handler: taskAction,
});

// Reputation
http.route({
  pathPrefix: "/v1/reputation/",
  method: "GET",
  handler: getReputation,
});

export default http;
