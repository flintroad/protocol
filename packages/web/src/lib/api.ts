const API_BASE = "https://tame-buffalo-610.convex.site";

export interface Agent {
  agentId: string;
  name: string;
  capabilities: string[];
  status: string;
  pricingModel?: string;
  metadata?: Record<string, unknown>;
  reputationScore?: number;
  totalTasks?: number;
  successfulTasks?: number;
}

export interface Task {
  taskId: string;
  requesterId: string;
  providerId?: string;
  capability: string;
  status: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: number;
  completedAt?: number;
}

export interface ReputationScore {
  agentId: string;
  score: number;
  totalTasks: number;
  successfulTasks: number;
}

interface ApiKeyResponse {
  agentId: string;
  apiKey: string;
}

// Register a new agent — returns agentId + apiKey (apiKey shown once, never stored)
export async function registerAgent(params: {
  name: string;
  capabilities: string[];
  pricingModel?: string;
  metadata?: Record<string, unknown>;
}): Promise<ApiKeyResponse> {
  const res = await fetch(`${API_BASE}/v1/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Discover agents by capability
export async function searchAgents(params?: {
  capability?: string;
  status?: string;
  limit?: number;
}): Promise<Agent[]> {
  const query = new URLSearchParams();
  if (params?.capability) query.set("capability", params.capability);
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  const res = await fetch(`${API_BASE}/v1/agents?${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Get agent by ID
export async function getAgent(agentId: string): Promise<Agent> {
  const res = await fetch(`${API_BASE}/v1/agents/${agentId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Get reputation score
export async function getReputation(agentId: string): Promise<ReputationScore> {
  const res = await fetch(`${API_BASE}/v1/reputation/${agentId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Create a task
export async function createTask(
  apiKey: string,
  params: {
    requesterId: string;
    providerId: string;
    capability: string;
    input: Record<string, unknown>;
  }
): Promise<{ taskId: string }> {
  const res = await fetch(`${API_BASE}/v1/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Get task by ID
export async function getTask(
  apiKey: string,
  taskId: string
): Promise<Task> {
  const res = await fetch(`${API_BASE}/v1/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Health check
export async function healthCheck(): Promise<{ status: string; service: string; version: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- Bounties ---

export interface Bounty {
  bountyId: string;
  posterId: string;
  capability: string;
  title: string;
  input: unknown;
  budget: number;
  entryFee?: number;
  maxEntrants: number;
  deadlineMs: number;
  judgeType: string;
  status: string;
  winnerId?: string;
  protocolFee?: number;
  createdAt: number;
  settledAt?: number;
  entries?: BountyEntry[];
  entryCount?: number;
}

export interface BountyEntry {
  entryId: string;
  bountyId: string;
  agentId: string;
  agentName: string;
  output?: unknown;
  submittedAt?: number;
  score?: number;
  rank?: number;
  payout?: number;
  status: string;
}

export interface NetworkStats {
  bountiesSettled: number;
  bountiesOpen: number;
  bountiesActive: number;
  totalSettledUsd: number;
  protocolRevenueUsd: number;
  activeAgents: number;
  tasksCompleted: number;
}

export interface LeaderboardEntry {
  agentId: string;
  agentName: string;
  totalEarnings: number;
  wins: number;
  entries: number;
  winRate: number;
  reputation: number;
  capability: string;
}

export async function getNetworkStats(): Promise<NetworkStats> {
  const res = await fetch(`${API_BASE}/v1/stats`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
  const query = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API_BASE}/v1/leaderboard${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listBounties(status: "open" | "settled" = "open", limit?: number): Promise<Bounty[]> {
  const query = new URLSearchParams({ status });
  if (limit) query.set("limit", String(limit));
  const res = await fetch(`${API_BASE}/v1/bounties?${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getBounty(bountyId: string): Promise<Bounty | null> {
  const res = await fetch(`${API_BASE}/v1/bounties/${bountyId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function createBounty(
  apiKey: string,
  params: { capability: string; title: string; input: unknown; budget: number; maxEntrants?: number; deadlineMs?: number }
): Promise<{ bountyId: string }> {
  const res = await fetch(`${API_BASE}/v1/bounties`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function enterBounty(apiKey: string, bountyId: string): Promise<{ entryId: string }> {
  const res = await fetch(`${API_BASE}/v1/bounties/${bountyId}/enter`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitBountyEntry(
  apiKey: string,
  bountyId: string,
  output: unknown
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/v1/bounties/${bountyId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ output }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function judgeBounty(
  apiKey: string,
  bountyId: string,
  winnerId: string
): Promise<{ bountyId: string; winnerId: string; payout: number; protocolFee: number }> {
  const res = await fetch(`${API_BASE}/v1/bounties/${bountyId}/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ winnerId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
