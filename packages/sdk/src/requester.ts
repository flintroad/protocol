import { FlintRoad } from "./client.js";
import type {
  AgentRegistration,
  AgentSearchParams,
  Agent,
  Task,
  RegisterResult,
} from "./types.js";

/**
 * Requester-side helper. Wraps FlintRoad client with convenience methods
 * for agents that request work from the network.
 */
export class FlintRoadRequester {
  public client: FlintRoad;
  public agentId?: string;

  constructor(client: FlintRoad) {
    this.client = client;
  }

  /** Register this requester on the network */
  async register(agent: AgentRegistration): Promise<RegisterResult> {
    const result = await this.client.register(agent);
    this.agentId = result.agentId;
    return result;
  }

  /** Discover providers that match the given criteria */
  async discover(params: AgentSearchParams): Promise<Agent[]> {
    return this.client.discover(params);
  }

  /**
   * Delegate a task and wait for the result.
   * Discovers a suitable provider if providerId is not specified.
   */
  async delegateAndWait(options: {
    capability: string;
    input: unknown;
    providerId?: string;
    budget?: number;
    deadlineMs?: number;
    timeoutMs?: number;
    type?: string;
  }): Promise<Task> {
    let { providerId } = options;

    // Auto-discover a provider if none specified
    if (!providerId) {
      const providers = await this.client.discover({
        capability: options.capability,
        status: "online",
        maxPrice: options.budget,
      });
      if (providers.length === 0) {
        throw new Error(
          `No providers found for capability: ${options.capability}`
        );
      }
      providerId = providers[0].agentId;
    }

    // Create the task
    const { taskId } = await this.client.delegate({
      providerId,
      capability: options.capability,
      type: options.type,
      input: options.input,
      budget: options.budget,
      deadlineMs: options.deadlineMs,
    });

    // Poll until completed or failed
    const timeoutMs = options.timeoutMs ?? options.deadlineMs ?? 60_000;

    return new Promise<Task>((resolve, reject) => {
      let settled = false;

      const cleanup = this.client.watchTask(taskId, (task) => {
        if (settled) return;
        if (
          task.status === "completed" ||
          task.status === "failed" ||
          task.status === "timeout"
        ) {
          settled = true;
          clearTimeout(timer);
          cleanup();
          if (task.status === "completed") {
            resolve(task);
          } else {
            reject(
              new Error(
                `Task ${task.status}: ${task.failReason ?? "unknown"}`
              )
            );
          }
        }
      });

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Task timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Fire-and-forget delegation. Returns the taskId for later retrieval.
   */
  async delegate(options: {
    capability: string;
    input: unknown;
    providerId?: string;
    budget?: number;
    deadlineMs?: number;
    type?: string;
  }): Promise<string> {
    let { providerId } = options;

    if (!providerId) {
      const providers = await this.client.discover({
        capability: options.capability,
        status: "online",
      });
      if (providers.length === 0) {
        throw new Error(
          `No providers found for capability: ${options.capability}`
        );
      }
      providerId = providers[0].agentId;
    }

    const { taskId } = await this.client.delegate({
      providerId,
      capability: options.capability,
      type: options.type,
      input: options.input,
      budget: options.budget,
      deadlineMs: options.deadlineMs,
    });

    return taskId;
  }
}
