/**
 * Flint Road — Full Protocol Loop Test
 *
 * Tests: register → discover → delegate → accept → complete → reputation
 * Run: npx tsx test-loop.ts
 */

import { FlintRoad } from "./packages/sdk/src/client.js";

const BASE_URL = "https://dependable-emu-627.convex.site";

async function main() {
  console.log("=== Flint Road Protocol Loop Test ===\n");

  // 1. Register Agent A (requester)
  console.log("1. Registering Agent A (requester)...");
  const agentA = new FlintRoad({ url: BASE_URL });
  const regA = await agentA.register({
    name: "SDK Test Requester",
    type: "machine",
    capabilities: ["orchestration"],
    description: "SDK test — delegates tasks to providers",
  });
  console.log(`   Agent A: ${regA.agentId}`);
  console.log(`   API Key: ${regA.apiKey.slice(0, 15)}...`);

  // 2. Register Agent B (provider)
  console.log("\n2. Registering Agent B (provider)...");
  const agentB = new FlintRoad({ url: BASE_URL });
  const regB = await agentB.register({
    name: "SDK Test Provider",
    type: "machine",
    capabilities: ["text_analysis", "summarization"],
    description: "SDK test — performs text analysis and summarization",
    pricing: { basePrice: 0.10, currency: "USDC" },
  });
  console.log(`   Agent B: ${regB.agentId}`);

  // 3. Agent A discovers Agent B
  console.log("\n3. Agent A discovers providers with 'text_analysis'...");
  const providers = await agentA.discover({ capability: "text_analysis" });
  console.log(`   Found ${providers.length} provider(s)`);
  const provider = providers.find((p) => p.agentId === regB.agentId);
  if (!provider) throw new Error("Agent B not found in discovery!");
  console.log(`   Matched: ${provider.name} (${provider.agentId})`);

  // 4. Agent A creates task for Agent B
  console.log("\n4. Agent A creates task for Agent B...");
  const { taskId } = await agentA.delegate({
    providerId: regB.agentId,
    capability: "text_analysis",
    input: {
      text: "Flint Road is a protocol for autonomous machine-to-machine and machine-to-human labor delegation.",
      instruction: "Count the words and identify the main topic.",
    },
  });
  console.log(`   Task: ${taskId}`);

  // 5. Agent B checks task status
  console.log("\n5. Agent B reads the task...");
  const task = await agentB.getTask(taskId);
  console.log(`   Status: ${task?.status}`);
  console.log(`   Capability: ${task?.capability}`);

  // 6. Agent B accepts
  console.log("\n6. Agent B accepts the task...");
  await agentB.acceptTask(taskId, 0.10);
  console.log("   Accepted.");

  // 7. Agent B completes
  console.log("\n7. Agent B completes the task...");
  await agentB.completeTask(taskId, {
    wordCount: 16,
    mainTopic: "autonomous labor delegation protocol",
    confidence: 0.95,
  });
  console.log("   Completed.");

  // 8. Agent A reads the result
  console.log("\n8. Agent A reads the completed task...");
  const result = await agentA.getTask(taskId);
  console.log(`   Status: ${result?.status}`);
  console.log(`   Output:`, JSON.stringify(result?.output, null, 2));

  // 9. Check reputation
  console.log("\n9. Checking Agent B's reputation...");
  const rep = await agentA.getReputation(regB.agentId);
  console.log(`   Score: ${rep?.score}`);
  console.log(`   Completion rate: ${rep?.completionRate}`);
  console.log(`   Total tasks: ${rep?.totalTasks}`);

  // 10. Cleanup — deregister both agents
  console.log("\n10. Cleaning up...");
  await agentA.deregister(regA.agentId);
  await agentB.deregister(regB.agentId);
  console.log("    Both agents deregistered.");

  console.log("\n=== All tests passed ===");
}

main().catch((e) => {
  console.error("\nTest failed:", e.message);
  process.exit(1);
});
