import { FlintRoad } from "./client.js";
import type { AgentRegistration, Task, RegisterResult } from "./types.js";

export type TaskHandler = (task: Task) => Promise<unknown>;

/**
 * Provider-side helper. Wraps FlintRoad client with convenience methods
 * for agents that provide services on the network.
 */
export class FlintRoadProvider {
  public client: FlintRoad;
  public agentId?: string;
  private handlers: Map<string, TaskHandler> = new Map();
  private stopPolling?: () => void;
  private processingTasks: Set<string> = new Set(); // Prevent double-processing

  constructor(client: FlintRoad) {
    this.client = client;
  }

  /** Register this provider on the network */
  async register(agent: AgentRegistration): Promise<RegisterResult> {
    const result = await this.client.register(agent);
    this.agentId = result.agentId;
    return result;
  }

  /** Register a handler for a specific capability */
  handle(capability: string, handler: TaskHandler): void {
    this.handlers.set(capability, handler);
  }

  /** Start listening for incoming tasks */
  start(options?: {
    intervalMs?: number;
    onError?: (e: Error) => void;
  }): void {
    this.stopPolling = this.client.onTask(
      async (tasks) => {
        // Process tasks concurrently, but skip already-processing ones
        const promises = tasks.map(async (task) => {
          if (this.processingTasks.has(task.taskId)) return;

          const handler = this.handlers.get(task.capability);
          if (!handler) return;

          this.processingTasks.add(task.taskId);
          try {
            await this.client.acceptTask(task.taskId);
            const output = await handler(task);
            await this.client.completeTask(task.taskId, output);
          } catch (e: any) {
            await this.client.failTask(task.taskId, e.message).catch(() => {});
          } finally {
            this.processingTasks.delete(task.taskId);
          }
        });

        await Promise.allSettled(promises);
      },
      {
        intervalMs: options?.intervalMs ?? 2000,
        onError: options?.onError,
      }
    );
  }

  /** Stop listening for tasks */
  stop(): void {
    this.stopPolling?.();
    this.stopPolling = undefined;
  }

  /** Go offline */
  async goOffline(): Promise<void> {
    this.stop();
    if (this.agentId) {
      await this.client.updateAgent(this.agentId, { status: "offline" });
    }
  }

  /** Come back online */
  async goOnline(options?: { intervalMs?: number }): Promise<void> {
    if (this.agentId) {
      await this.client.updateAgent(this.agentId, { status: "online" });
    }
    this.start({ intervalMs: options?.intervalMs ?? 2000 });
  }
}
