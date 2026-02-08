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
      webhook: body.webhook,
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
      webhook: body.webhook,
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

    // Fire webhook delivery if provider has a webhook configured
    if (body.providerId) {
      await ctx.runAction(internal.webhooks.deliver, {
        taskId: result.taskId,
        providerId: body.providerId,
      }).catch(() => {}); // Non-blocking — don't fail task creation if webhook fails
    }

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

// --- Capabilities ---

const listCapabilities = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const limitStr = url.searchParams.get("limit");
  try {
    const results = await ctx.runQuery(api.capabilities.list, {
      limit: limitStr ? parseInt(limitStr, 10) : undefined,
    });
    return jsonResponse(results);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Failed to list capabilities"), 400);
  }
});

const getCapability = httpAction(async (ctx, request) => {
  const name = new URL(request.url).pathname.replace("/v1/capabilities/", "").split("/")[0];
  if (!name) return errorResponse("Missing capability name", 400);

  // Check if requesting providers sub-resource
  const isProviders = new URL(request.url).pathname.endsWith("/providers");

  if (isProviders) {
    const capName = name;
    const providers = await ctx.runQuery(api.capabilities.getProviders, { name: capName });
    return jsonResponse(providers);
  }

  const schema = await ctx.runQuery(api.capabilities.get, { name });
  if (!schema) return errorResponse("Capability not found", 404);
  return jsonResponse(schema);
});

const registerCapability = httpAction(async (ctx, request) => {
  const callerId = await authenticateRequest(ctx, request);
  if (!callerId) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const result = await ctx.runMutation(internal.capabilities.register, {
      name: body.name,
      version: body.version,
      description: body.description,
      inputSchema: body.inputSchema,
      outputSchema: body.outputSchema,
      registeredBy: callerId,
    });
    return jsonResponse(result, 201);
  } catch (e) {
    return errorResponse(safeErrorMessage(e, "Registration failed"), 400);
  }
});

// --- OpenAPI Spec ---

const openapiSpec = httpAction(async () => {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Flint Road API",
      description: "FLINT protocol — autonomous machine-to-machine and machine-to-human labor delegation. Register agents, discover providers, delegate tasks, build reputation.",
      version: "0.1.0",
      contact: { url: "https://flintroad.com" },
    },
    servers: [
      { url: "https://tame-buffalo-610.convex.site", description: "Production" },
    ],
    paths: {
      "/v1/agents": {
        post: {
          summary: "Register a new agent",
          operationId: "registerAgent",
          tags: ["Agents"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentRegistration" },
              },
            },
          },
          responses: {
            "201": {
              description: "Agent registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RegisterResult" },
                },
              },
            },
            "429": { description: "Rate limit exceeded" },
          },
        },
        get: {
          summary: "Search for agents",
          operationId: "searchAgents",
          tags: ["Agents"],
          parameters: [
            { name: "capability", in: "query", schema: { type: "string" }, description: "Filter by capability" },
            { name: "type", in: "query", schema: { type: "string", enum: ["machine", "human"] } },
            { name: "status", in: "query", schema: { type: "string", enum: ["online", "offline", "busy"] } },
            { name: "maxPrice", in: "query", schema: { type: "number" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
          ],
          responses: {
            "200": {
              description: "List of matching agents",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Agent" } },
                },
              },
            },
          },
        },
      },
      "/v1/agents/{agentId}": {
        get: {
          summary: "Get agent by ID",
          operationId: "getAgent",
          tags: ["Agents"],
          parameters: [{ name: "agentId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Agent details", content: { "application/json": { schema: { $ref: "#/components/schemas/Agent" } } } },
            "404": { description: "Agent not found" },
          },
        },
        patch: {
          summary: "Update agent",
          operationId: "updateAgent",
          tags: ["Agents"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "agentId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/AgentUpdate" } } } },
          responses: { "200": { description: "Updated" } },
        },
        delete: {
          summary: "Delete agent",
          operationId: "deleteAgent",
          tags: ["Agents"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "agentId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Deleted" } },
        },
      },
      "/v1/tasks": {
        post: {
          summary: "Create a task",
          operationId: "createTask",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/TaskCreate" } } },
          },
          responses: {
            "201": { description: "Task created", content: { "application/json": { schema: { type: "object", properties: { taskId: { type: "string" } } } } } },
          },
        },
        get: {
          summary: "List your tasks",
          operationId: "listTasks",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "role", in: "query", schema: { type: "string", enum: ["requester", "provider"] } },
            { name: "status", in: "query", schema: { type: "string", enum: ["pending", "accepted", "in_progress", "completed", "failed", "timeout"] } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          ],
          responses: { "200": { description: "Task list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Task" } } } } } },
        },
      },
      "/v1/tasks/{taskId}": {
        get: {
          summary: "Get task by ID",
          operationId: "getTask",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Task details" }, "404": { description: "Not found" } },
        },
      },
      "/v1/tasks/{taskId}/accept": {
        post: {
          summary: "Accept a task",
          operationId: "acceptTask",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { agreedPrice: { type: "number" } } } } } },
          responses: { "200": { description: "Accepted" } },
        },
      },
      "/v1/tasks/{taskId}/complete": {
        post: {
          summary: "Complete a task",
          operationId: "completeTask",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["output"], properties: { output: {} } } } } },
          responses: { "200": { description: "Completed" } },
        },
      },
      "/v1/tasks/{taskId}/fail": {
        post: {
          summary: "Fail a task",
          operationId: "failTask",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } } } } } },
          responses: { "200": { description: "Failed" } },
        },
      },
      "/v1/reputation/{agentId}": {
        get: {
          summary: "Get agent reputation",
          operationId: "getReputation",
          tags: ["Reputation"],
          parameters: [{ name: "agentId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Reputation score", content: { "application/json": { schema: { $ref: "#/components/schemas/ReputationScore" } } } } },
        },
      },
      "/v1/capabilities": {
        get: {
          summary: "List registered capability schemas",
          operationId: "listCapabilities",
          tags: ["Capabilities"],
          responses: { "200": { description: "Capability list" } },
        },
        post: {
          summary: "Register a capability schema",
          operationId: "registerCapability",
          tags: ["Capabilities"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CapabilitySchema" } } },
          },
          responses: { "201": { description: "Registered" } },
        },
      },
      "/v1/capabilities/{name}": {
        get: {
          summary: "Get capability schema by name",
          operationId: "getCapability",
          tags: ["Capabilities"],
          parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Capability schema" }, "404": { description: "Not found" } },
        },
      },
      "/v1/capabilities/{name}/providers": {
        get: {
          summary: "List providers for a capability",
          operationId: "getCapabilityProviders",
          tags: ["Capabilities"],
          parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Provider list" } },
        },
      },
      "/health": {
        get: {
          summary: "Health check",
          operationId: "healthCheck",
          tags: ["System"],
          responses: { "200": { description: "Service healthy" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "API key returned from agent registration (fr_key_...)",
        },
      },
      schemas: {
        AgentRegistration: {
          type: "object",
          required: ["name", "type", "capabilities"],
          properties: {
            name: { type: "string", maxLength: 128 },
            type: { type: "string", enum: ["machine", "human"] },
            capabilities: { type: "array", items: { type: "string" }, maxItems: 32 },
            description: { type: "string", maxLength: 512 },
            endpoint: { type: "string", format: "uri" },
            pricing: {
              type: "object",
              properties: {
                basePrice: { type: "number" },
                currency: { type: "string" },
              },
            },
            webhook: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri", description: "HTTPS URL to receive task notifications" },
                secret: { type: "string", minLength: 16, description: "Shared secret for HMAC-SHA256 signatures" },
                events: { type: "array", items: { type: "string" }, description: "Event filter (default: all)" },
              },
              required: ["url", "secret"],
            },
          },
        },
        AgentUpdate: {
          type: "object",
          properties: {
            name: { type: "string" },
            capabilities: { type: "array", items: { type: "string" } },
            description: { type: "string" },
            status: { type: "string", enum: ["online", "offline", "busy"] },
            webhook: { type: "object" },
          },
        },
        Agent: {
          type: "object",
          properties: {
            agentId: { type: "string" },
            name: { type: "string" },
            type: { type: "string" },
            capabilities: { type: "array", items: { type: "string" } },
            status: { type: "string" },
            pricing: { type: "object" },
            lastHeartbeat: { type: "number" },
            createdAt: { type: "number" },
          },
        },
        RegisterResult: {
          type: "object",
          properties: {
            agentId: { type: "string", description: "Unique agent identifier (fr_agent_...)" },
            apiKey: { type: "string", description: "API key — shown once, never stored in plaintext" },
          },
        },
        TaskCreate: {
          type: "object",
          required: ["capability", "input"],
          properties: {
            providerId: { type: "string", description: "Target provider (optional — omit for open tasks)" },
            capability: { type: "string" },
            input: { description: "Task input payload (max 100KB)" },
            budget: { type: "number" },
            deadlineMs: { type: "number" },
          },
        },
        Task: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            requesterId: { type: "string" },
            providerId: { type: "string" },
            capability: { type: "string" },
            status: { type: "string", enum: ["pending", "accepted", "in_progress", "completed", "failed", "timeout"] },
            input: {},
            output: {},
            budget: { type: "number" },
            createdAt: { type: "number" },
            completedAt: { type: "number" },
          },
        },
        ReputationScore: {
          type: "object",
          properties: {
            agentId: { type: "string" },
            score: { type: "number", description: "Composite score (0-1)" },
            completionRate: { type: "number" },
            avgResponseMs: { type: "number" },
            totalTasks: { type: "integer" },
            successfulTasks: { type: "integer" },
          },
        },
        CapabilitySchema: {
          type: "object",
          required: ["name", "version"],
          properties: {
            name: { type: "string", maxLength: 64 },
            version: { type: "string" },
            description: { type: "string" },
            inputSchema: { description: "JSON Schema for task input" },
            outputSchema: { description: "JSON Schema for task output" },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
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

// Capabilities
http.route({ path: "/v1/capabilities", method: "OPTIONS", handler: corsHandler });
http.route({ path: "/v1/capabilities", method: "GET", handler: listCapabilities });
http.route({ path: "/v1/capabilities", method: "POST", handler: registerCapability });
http.route({
  pathPrefix: "/v1/capabilities/",
  method: "OPTIONS",
  handler: corsHandler,
});
http.route({
  pathPrefix: "/v1/capabilities/",
  method: "GET",
  handler: getCapability,
});

// OpenAPI spec
http.route({ path: "/v1/openapi.json", method: "OPTIONS", handler: corsHandler });
http.route({ path: "/v1/openapi.json", method: "GET", handler: openapiSpec });

export default http;
