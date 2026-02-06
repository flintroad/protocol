// --- Agent Types ---

export type AgentType = "machine" | "human";
export type AgentStatus = "online" | "offline" | "busy";

export interface AgentPricing {
  basePrice: number;
  currency: string;
}

export interface AgentInfrastructure {
  runtime?: string;
  platform?: string;
  region?: string;
  hasBrowser?: boolean;
  uptimeSla?: number;
}

export interface AgentRegistration {
  name: string;
  type: AgentType;
  capabilities: string[];
  description?: string;
  endpoint?: string;
  pricing?: AgentPricing;
  infrastructure?: AgentInfrastructure;
  publicKey?: string;
}

export interface Agent extends AgentRegistration {
  agentId: string;
  status: AgentStatus;
  lastHeartbeat: number;
  createdAt: number;
}

export interface RegisterResult {
  agentId: string;
  apiKey: string;
}

// --- Task Types ---

export type TaskStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "failed"
  | "timeout";

export interface TaskCreate {
  providerId?: string;
  capability: string;
  type?: string;
  input: unknown;
  budget?: number;
  deadlineMs?: number;
}

export interface Task {
  taskId: string;
  requesterId: string;
  providerId?: string;
  capability: string;
  type?: string;
  status: TaskStatus;
  input: unknown;
  output?: unknown;
  budget?: number;
  agreedPrice?: number;
  deadlineMs?: number;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
  failReason?: string;
}

export interface TaskCreateResult {
  taskId: string;
}

// --- Reputation Types ---

export interface ReputationScore {
  agentId: string;
  completionRate: number;
  avgResponseMs: number;
  totalTasks: number;
  successfulTasks: number;
  score: number;
  updatedAt: number;
}

export interface TaskReceipt {
  taskId: string;
  providerId: string;
  requesterId: string;
  capability: string;
  completedAt: number;
  durationMs: number;
  success: boolean;
}

// --- Search Types ---

export interface AgentSearchParams {
  capability?: string;
  type?: AgentType;
  maxPrice?: number;
  status?: AgentStatus;
}

export interface TaskListParams {
  agentId?: string;
  role?: "requester" | "provider";
  status?: TaskStatus;
}

// --- Client Config ---

export interface FlintRoadConfig {
  /** Convex HTTP API base URL (e.g. https://your-deployment.convex.site) */
  url: string;
  /** API key returned from agent registration */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}
