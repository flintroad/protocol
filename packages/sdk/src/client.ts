import type {
  FlintRoadConfig,
  Agent,
  AgentRegistration,
  AgentSearchParams,
  RegisterResult,
  Task,
  TaskCreate,
  TaskCreateResult,
  TaskListParams,
  ReputationScore,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export class FlintRoad {
  private url: string;
  private apiKey?: string;
  private timeoutMs: number;
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>> =
    new Map();

  constructor(config: FlintRoadConfig) {
    this.url = config.url.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // --- HTTP helpers ---

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs
    );

    try {
      const res = await fetch(`${this.url}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new FlintRoadError("Invalid response", res.status);
      }

      if (!res.ok) {
        throw new FlintRoadError(
          data.error || "Request failed",
          res.status,
          data
        );
      }
      return data as T;
    } catch (e) {
      if (e instanceof FlintRoadError) throw e;
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new FlintRoadError(
          `Request timed out after ${this.timeoutMs}ms`,
          0
        );
      }
      throw new FlintRoadError(
        e instanceof Error ? e.message : "Network error",
        0
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // --- Agent operations ---

  async register(agent: AgentRegistration): Promise<RegisterResult> {
    const result = await this.request<RegisterResult>("/v1/agents", {
      method: "POST",
      body: JSON.stringify(agent),
    });
    this.apiKey = result.apiKey;
    return result;
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      return await this.request<Agent>(`/v1/agents/${agentId}`);
    } catch (e) {
      if (e instanceof FlintRoadError && e.status === 404) return null;
      throw e;
    }
  }

  async discover(params: AgentSearchParams = {}): Promise<Agent[]> {
    const query = new URLSearchParams();
    if (params.capability) query.set("capability", params.capability);
    if (params.type) query.set("type", params.type);
    if (params.maxPrice !== undefined)
      query.set("maxPrice", String(params.maxPrice));
    if (params.status) query.set("status", params.status);
    const qs = query.toString();
    return this.request<Agent[]>(`/v1/agents${qs ? `?${qs}` : ""}`);
  }

  async updateAgent(
    agentId: string,
    updates: Partial<AgentRegistration> & { status?: string }
  ): Promise<{ success: boolean }> {
    return this.request(`/v1/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deregister(agentId: string): Promise<{ success: boolean }> {
    return this.request(`/v1/agents/${agentId}`, { method: "DELETE" });
  }

  // --- Task operations ---

  async delegate(task: TaskCreate): Promise<TaskCreateResult> {
    return this.request<TaskCreateResult>("/v1/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }

  async acceptTask(
    taskId: string,
    agreedPrice?: number
  ): Promise<{ success: boolean }> {
    return this.request(`/v1/tasks/${taskId}/accept`, {
      method: "POST",
      body: JSON.stringify({ agreedPrice }),
    });
  }

  async completeTask(
    taskId: string,
    output: unknown
  ): Promise<{ success: boolean }> {
    return this.request(`/v1/tasks/${taskId}/complete`, {
      method: "POST",
      body: JSON.stringify({ output }),
    });
  }

  async failTask(
    taskId: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    return this.request(`/v1/tasks/${taskId}/fail`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      return await this.request<Task>(`/v1/tasks/${taskId}`);
    } catch (e) {
      if (e instanceof FlintRoadError && e.status === 404) return null;
      throw e;
    }
  }

  async listTasks(params: TaskListParams = {}): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params.role) query.set("role", params.role);
    if (params.status) query.set("status", params.status);
    const qs = query.toString();
    return this.request<Task[]>(`/v1/tasks${qs ? `?${qs}` : ""}`);
  }

  // --- Reputation ---

  async getReputation(agentId: string): Promise<ReputationScore | null> {
    try {
      return await this.request<ReputationScore>(
        `/v1/reputation/${agentId}`
      );
    } catch (e) {
      if (e instanceof FlintRoadError && e.status === 404) return null;
      throw e;
    }
  }

  // --- Real-time polling ---

  /**
   * Poll for incoming tasks. Prevents double-processing with a lock.
   * For true real-time, use the Convex client directly with subscriptions.
   */
  onTask(
    callback: (tasks: Task[]) => void,
    options?: { intervalMs?: number; onError?: (e: Error) => void }
  ): () => void {
    const intervalMs = options?.intervalMs ?? 2000;
    const id = `poll_${Date.now()}`;
    let processing = false;

    const interval = setInterval(async () => {
      if (processing) return; // Skip if previous poll still running
      processing = true;
      try {
        const tasks = await this.listTasks({
          role: "provider",
          status: "pending",
        });
        if (tasks.length > 0) callback(tasks);
      } catch (e) {
        options?.onError?.(
          e instanceof Error ? e : new Error(String(e))
        );
      } finally {
        processing = false;
      }
    }, intervalMs);
    this.pollingIntervals.set(id, interval);

    return () => {
      clearInterval(interval);
      this.pollingIntervals.delete(id);
    };
  }

  /**
   * Watch a specific task for status changes.
   */
  watchTask(
    taskId: string,
    callback: (task: Task) => void,
    options?: { intervalMs?: number; onError?: (e: Error) => void }
  ): () => void {
    const intervalMs = options?.intervalMs ?? 1000;
    const id = `watch_${taskId}`;
    let lastStatus: string | undefined;

    const interval = setInterval(async () => {
      try {
        const task = await this.getTask(taskId);
        if (task && task.status !== lastStatus) {
          lastStatus = task.status;
          callback(task);
        }
      } catch (e) {
        options?.onError?.(
          e instanceof Error ? e : new Error(String(e))
        );
      }
    }, intervalMs);
    this.pollingIntervals.set(id, interval);

    return () => {
      clearInterval(interval);
      this.pollingIntervals.delete(id);
    };
  }

  /** Stop all active polling */
  destroy(): void {
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();
  }
}

export class FlintRoadError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "FlintRoadError";
  }
}
