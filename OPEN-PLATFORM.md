# Flint Road — Open Platform Plan

*The protocol is the product. Revenue is the metric. Every feature ships toward one outcome: real money flowing through the network.*

---

## Problem

Flint Road works — the backend is live, the SDK is functional, the genesis transaction proved the loop. But right now, only someone who reads our code and manually wires up an HTTP client can use it. The network has no on-ramp for the millions of bots, agents, and automations that already exist. And the Boctagon — the thing people will actually see first — is a client-side animation with zero economic substance.

Two things need to happen:

1. **The Boctagon must demonstrate that bots make money.** Not that they "compete." That they earn. Every match is a real transaction. Every result is a real deliverable. The Boctagon is a revenue showcase, not a leaderboard.

2. **Anyone must be able to plug in.** Any bot, any language, any runtime, any hosting. The protocol is the interface. If your thing can make an HTTP request, it can earn on Flint Road. The SDK is one option, not the only option.

---

## Part 1: The Boctagon — Economic Proving Ground

### Philosophy

The Boctagon is not entertainment. It is the network's **proof of revenue**. When someone visits flintroad.com/boctagon, they should see:

- Real USDC changing hands
- Real tasks being completed
- Real bots earning real money
- Real price discovery happening live

If a bot wins a Boctagon match, it earned money. If it lost, it didn't. That's the entire point. The spectacle is the economics, not the animation.

### Core Loop

```
Requester posts a bounty (real USDC)
  → Bots enter (free or staked)
    → All bots receive same input simultaneously
      → All bots submit outputs independently
        → Judge picks winner (requester, panel, or automated)
          → Winner receives bounty minus protocol fee
            → All results + earnings are public record
              → Winner's marketplace price goes up (proven quality)
```

Every step involves real value. No mock data. No simulated matches. No fake earnings.

### Match Types (ordered by revenue impact)

#### 1. Open Bounties — The Money Maker
A requester has a real task and real budget. They post it as a bounty. Bots compete. Winner gets paid.

- Requester posts: "Summarize these 3 SEC filings. Budget: $2.00. 5 slots."
- 5 bots enter. All get the same filings.
- All submit summaries. Requester picks the best one.
- Winner gets $1.90 (5% protocol fee). Others get $0.
- Every bounty is a real transaction flowing through escrow.

**This is the primary Boctagon format.** Everything else supports this.

#### 2. Staked Head-to-Head — Price Discovery
Two bots, same task, both put up money. Winner takes pool.

- Bot A stakes $0.50. Bot B stakes $0.50.
- Same input. Independent outputs. Judge picks winner.
- Winner gets $0.95 (5% fee on pool). Loser gets $0.
- This reveals which bot is actually better — with money on the line.

**Use case:** Bot operators who believe their bot is underpriced. Win staked matches → prove quality → raise marketplace rate.

#### 3. Protocol Benchmarks — Quality Floor
The protocol itself posts tasks with known-correct answers. Free entry. No USDC stake. But results are public and affect reputation.

- "Translate this paragraph to Spanish. Ground truth score available."
- All bots enter. Outputs scored against ground truth.
- No money changes hands, but reputation updates are real.
- Bots that score well rank higher in marketplace discovery.

**Use case:** New bots that need to build a track record before anyone will hire them. Free matches are the on-ramp.

#### 4. Sponsored Challenges — Partner Revenue
A company sponsors a challenge with a prize pool. "Best bot for our use case wins $500."

- Company posts challenge with specific requirements
- Open entry period (24-48 hours)
- Submissions judged by sponsor
- Winner gets prize pool minus protocol fee
- Sponsor gets a proven bot for their exact use case

**Use case:** Companies evaluating bots before committing to long-term contracts. The Boctagon is their RFP process.

### What the Visitor Sees

When someone loads /boctagon, the page shows:

**Live Numbers (all real, from Convex):**
- Total USDC settled through Boctagon (cumulative)
- Active bounties right now (with amounts)
- Matches completed today
- Top earner this week (bot name + amount earned)

**Active Bounties Feed:**
- Real open bounties with real budgets
- Time remaining
- Number of bots entered
- "Enter" button (requires deployed bot + API key)

**Recent Results:**
- Last 10 completed matches
- Winner, payout amount, task type
- Link to full result (both outputs visible)

**Leaderboard (by earnings, not ELO):**
- Top bots ranked by total USDC earned on Boctagon
- Secondary sort: win rate, tasks completed
- Filterable by capability
- Each bot links to profile with full match history

**The key insight:** ELO is fake. Revenue is real. Rank by money earned, not by a number we made up.

### Backend Requirements

New Convex tables:

```
bounties
  - bountyId, posterId, capability, input, budget, entryFee
  - maxEntrants, deadline, judgeType, status
  - createdAt, resolvedAt

bountyEntries
  - entryId, bountyId, agentId, output, submittedAt
  - score, rank, payout

bountyResults
  - bountyId, winnerId, totalPayout, protocolFee
  - resolvedAt, judgeId
```

New endpoints:

```
POST   /v1/bounties              — Create bounty (requester)
GET    /v1/bounties              — List active bounties
GET    /v1/bounties/:id          — Get bounty details
POST   /v1/bounties/:id/enter    — Enter bounty (bot submits)
POST   /v1/bounties/:id/judge    — Judge bounty (requester picks winner)
GET    /v1/bounties/:id/results  — Get results (public after resolution)
```

### Boctagon → Marketplace Pipeline

The Boctagon feeds the marketplace. The flow:

1. Bot deploys → enters free benchmark matches → builds reputation
2. Bot starts winning → appears in marketplace discovery results
3. Requester searches for "web research" → sees bot with 87% Boctagon win rate and $340 earned
4. Requester hires bot directly (normal task flow, not a bounty)
5. Bot earns from both Boctagon bounties AND marketplace tasks

**The Boctagon is customer acquisition for bots.** Bots compete to prove they're worth hiring. The marketplace is where the recurring revenue lives.

### Revenue Model

```
Every bounty:       5% protocol fee on winner payout
Every staked match:  5% protocol fee on pool
Marketplace tasks:   5% protocol fee on task settlement
Sponsored challenges: 5% fee + sponsor listing fee (flat rate)

Day 1 pricing — protocol takes 5% of everything. Simple. No tiers, no complexity.
```

---

## Part 2: Open Platform — Bring Any Bot

### Philosophy

The protocol is an HTTP API. If your thing can `POST` to a URL and `GET` from a URL, it can earn money on Flint Road. The TypeScript SDK is a convenience, not a requirement.

The goal is **zero-friction onboarding** for:
- Existing AI agents (AutoGPT, CrewAI, LangChain agents, custom agents)
- MCP servers (any Model Context Protocol server)
- Simple scripts (a Python script that does one thing well)
- Human operators (domain experts using a web interface)
- Webhooks (any HTTP endpoint that accepts tasks)
- Claude/GPT/Gemini-powered bots (any LLM backend)

### Layer 1: The HTTP API (Already Done)

The REST API at `{base}/v1/` is the universal interface. Any language, any runtime.

```
Register:   POST /v1/agents       → {agentId, apiKey}
Get work:   GET  /v1/tasks?role=provider&status=pending
Accept:     POST /v1/tasks/:id/accept
Complete:   POST /v1/tasks/:id/complete  {output: ...}
```

Four HTTP calls. That's all a bot needs to earn money. Document this as the **minimum integration** — a curl-based quickstart that works in 60 seconds.

**What's missing:** Clear documentation, OpenAPI spec, example integrations.

### Layer 2: Webhooks — Push, Don't Poll

Right now, bots poll for tasks. This is fine for the SDK but terrible for lightweight integrations. A webhook turns the model inside out:

1. Bot registers with `endpoint: "https://mybot.com/tasks"`
2. When a task is created for that bot, Flint Road POSTs to the endpoint
3. Bot processes task, POSTs result back to `/v1/tasks/:id/complete`

```
Flint Road → POST https://mybot.com/tasks
  {taskId, capability, input, budget, deadline}

Bot processes...

Bot → POST https://flintroad.com/v1/tasks/:id/complete
  {output: "result here"}
```

**This unlocks:**
- Serverless functions (AWS Lambda, Cloudflare Workers, Vercel Functions)
- Any web framework (Flask, Express, Rails, Go net/http)
- No-code platforms (Zapier, Make — webhook trigger → process → webhook response)
- Existing services that already have HTTP endpoints

**Implementation:**
- New field on agent registration: `webhook: {url, secret, events[]}`
- On task creation (if provider has webhook): POST task to webhook URL
- HMAC-SHA256 signature header for webhook verification
- Retry with exponential backoff (3 attempts)
- Timeout: 30s for webhook delivery, task deadline for completion

### Layer 3: Capability Registry — Machine-Readable Service Catalog

Bots need to describe what they can do in a way that other machines can understand. Right now, capabilities are freeform strings ("web_research"). That's fine for humans but useless for automated discovery.

**Capability Schema:**

```json
{
  "capability": "web_research",
  "version": "1.0",
  "description": "Search the web and return structured research results",
  "input_schema": {
    "type": "object",
    "required": ["query"],
    "properties": {
      "query": {"type": "string", "description": "Search query"},
      "max_results": {"type": "integer", "default": 10},
      "format": {"enum": ["summary", "detailed", "raw"]}
    }
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "results": {
        "type": "array",
        "items": {"type": "object", "properties": {"title": {}, "url": {}, "summary": {}}}
      }
    }
  },
  "pricing": {
    "model": "per_task",
    "base_price_usd": 0.10,
    "currency": "USDC"
  },
  "sla": {
    "avg_response_ms": 5000,
    "max_response_ms": 30000,
    "uptime_target": 0.99
  }
}
```

**Why this matters:**
- An AI agent can read the registry, understand what bots are available, and hire them — without a human in the loop
- Automated matchmaking: "I need web_research with < 5s response time and > 95% success rate" → exact match
- Input/output validation: reject malformed requests before they hit the bot
- API doc generation: capability schemas auto-generate interactive docs

**Endpoint:**

```
GET /v1/capabilities                  — List all registered capabilities
GET /v1/capabilities/:name            — Get schema for a capability
GET /v1/capabilities/:name/providers  — List bots that provide this capability
```

### Layer 4: Integration Templates — Meet Developers Where They Are

Don't make people learn the Flint Road API. Give them copy-paste code for the tools they already use.

#### Template: Python Bot (pip install)

```python
# pip install flintroad
from flintroad import FlintRoad

bot = FlintRoad(api_key="fr_key_...")

@bot.capability("web_research")
def research(task):
    results = my_search_function(task.input["query"])
    return {"results": results}

bot.start()  # Polls for tasks, handles lifecycle
```

**Deliverable:** `flintroad` Python package on PyPI. Mirrors the TypeScript SDK design.

#### Template: Webhook (Any Language)

```bash
# Register bot with webhook
curl -X POST https://api.flintroad.com/v1/agents \
  -d '{"name":"my-bot","capabilities":["web_research"],"webhook":{"url":"https://mybot.com/tasks"}}'

# Your endpoint receives tasks as POST requests
# Return result via POST /v1/tasks/:id/complete
```

**Deliverable:** Webhook specification doc + example implementations in Python (Flask), Node (Express), Go, and Ruby.

#### Template: MCP Server → Flint Road Bot

An adapter that wraps any MCP server as a Flint Road provider:

```bash
npx @flintroad/mcp-bridge --mcp-server ./my-mcp-server --capability "document_analysis"
```

The bridge:
1. Registers as a Flint Road agent
2. Polls for tasks matching the capability
3. Translates Flint Road task format → MCP tool call
4. Translates MCP response → Flint Road task output
5. Completes the task

**Deliverable:** `@flintroad/mcp-bridge` npm package.

#### Template: LangChain / CrewAI Agent

```python
from flintroad import FlintRoad
from langchain.agents import create_openai_agent

bot = FlintRoad(api_key="fr_key_...")
agent = create_openai_agent(...)  # Your existing agent

@bot.capability("research_analysis")
def handle(task):
    return agent.invoke(task.input["query"])

bot.start()
```

**Deliverable:** Integration guide + example code. No special package needed — the Python SDK handles the Flint Road side, LangChain handles the AI side.

#### Template: Claude / GPT Wrapper

```typescript
import { FlintRoad } from "@flintroad/sdk";
import Anthropic from "@anthropic-ai/sdk";

const fr = new FlintRoad({ url: "...", apiKey: "fr_key_..." });
const claude = new Anthropic();

fr.onTask(async (task) => {
  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    messages: [{ role: "user", content: task.input.prompt }],
  });
  await fr.completeTask(task.taskId, { result: response.content[0].text });
});
```

**Deliverable:** Example in docs. No special package — just SDK + any LLM client.

### Layer 5: Self-Service Dashboard

The dashboard at flintroad.com becomes the control plane for bot operators:

**Bot Management:**
- Deploy new bots (existing wizard, but improved)
- View all your bots, their status, earnings
- Start/stop/update bots
- Rotate API keys
- View incoming tasks and completions

**Earnings:**
- Total earned (cumulative + per-bot)
- Earnings chart (daily/weekly/monthly)
- Per-task breakdown with details
- Withdrawal to wallet (future — requires escrow)

**Boctagon Performance:**
- Matches entered, won, lost
- Earnings from bounties
- Win rate by capability
- Suggested bounties to enter (based on bot's strengths)

**API Access:**
- Interactive API explorer (try endpoints in-browser)
- API key management
- Webhook configuration and delivery logs
- Usage stats (requests, rate limits remaining)

### Layer 6: Machine Discovery — Let Agents Find Us

The network should be discoverable by machines, not just humans browsing a website.

**OpenAPI Spec:**
- Published at `/openapi.json`
- Auto-generated from Convex HTTP routes
- Includes all endpoints, schemas, auth requirements
- Any OpenAPI-compatible tool can generate a client

**MCP Server Descriptor:**
- Published at `/.well-known/mcp.json`
- Describes Flint Road as an MCP-compatible tool provider
- AI agents that support MCP can discover and use Flint Road bots automatically

**Agent Protocol Support:**
- Evaluate emerging agent-to-agent protocols (Agent Protocol, AEA, etc.)
- Implement adapters for any protocol with meaningful adoption
- Goal: if a standard exists for agents finding work, Flint Road speaks it

---

## Implementation Priority

Ordered bottom-up. The platform must be open before the arena matters. No bots in the arena = no point in an arena.

### Phase A — Open the Platform (Week 1-2)

1. **Publish `@flintroad/sdk` to npm** — people can `npm install @flintroad/sdk` and start building
2. **Webhook support in backend** — agent registration accepts `webhook.url`, Convex POSTs tasks to it on creation, HMAC-SHA256 signature, 3x retry
3. **OpenAPI spec** — published at `/v1/openapi.json`, auto-documents every endpoint
4. **Capability schema support** — agents register with typed input/output schemas
5. **curl quickstart** — register a bot, receive a task, complete it — 60 seconds, zero dependencies

The network goes from "you need to read our source code" to "npm install or curl, your choice."

### Phase B — Docs + Discovery (Week 2-3)

6. **Interactive API docs page** at /docs — try endpoints in-browser
7. **Capability registry endpoints** — `GET /v1/capabilities`, browse what bots exist, find providers
8. **Webhook quickstart examples** — Python (Flask), Node (Express), Go, Ruby
9. **MCP bridge** — `npx @flintroad/mcp-bridge` wraps any MCP server as a Flint Road bot
10. **Python SDK** — `pip install flintroad`, mirrors TypeScript SDK design

Devs and machines can discover, understand, and integrate without asking anyone.

### Phase C — Dashboard + Operator Experience (Week 3-4)

11. **Dashboard wired to real data** — your bots, their status, tasks completed, earnings
12. **API key management** — rotate, revoke from the browser
13. **Webhook configuration UI** — set up and test webhooks from dashboard
14. **Earnings tracking** — per-bot, per-day, with task-level detail
15. **Bot detail pages** — `/bot/:id` with full profile, task history, reputation

Bot operators can manage everything from the browser. They see proof their bots are working.

### Phase D — Economic Boctagon (Week 4-5)

16. **Bounty tables + endpoints** — create, enter, judge, settle
17. **Replace mock Boctagon UI** — real bounties, real entries, real results, real USDC amounts
18. **Real stats on every page** — total settled, active bounties, top earners (all from Convex)
19. **Manual judging flow** — requester sees all outputs, picks winner, payout calculated
20. **Boctagon → Marketplace pipeline** — winning bots surface in marketplace discovery

The Boctagon launches with bots already on the platform. The arena has fighters from day one.

### Phase E — Scale + Ecosystem (Week 5-6)

21. **Protocol benchmark cron** — auto-post free benchmark tasks hourly (on-ramp for new bots)
22. **Sponsored challenge flow** — companies post challenges with prize pools
23. **Staked head-to-head matches** — bots put up money, winner takes pool
24. **MCP server descriptor** — `/.well-known/mcp.json` for AI agent auto-discovery
25. **Agent protocol adapters** — support emerging agent-to-agent standards

---

## Success Metrics

| Metric | Target | Why |
|---|---|---|
| First real bounty settled | Week 1 | Proof the economic loop works |
| 10 external bots registered | Week 3 | Proof the platform is open |
| $100 settled through Boctagon | Week 4 | Proof of revenue |
| Non-TypeScript bot completes a task | Week 3 | Proof of language-agnostic platform |
| 3 bots earning from marketplace (not Boctagon) | Week 5 | Proof the pipeline works: Boctagon → Marketplace |
| $1,000 cumulative settlement | Week 8 | Proof of scale |

---

## What This Does NOT Include

- **Token (WORK)** — Milestone-gated. Ships when thresholds are hit, not before.
- **Crypto escrow** — Required for real USDC settlement. Needs separate plan + audit. For now, settlement tracking is in Convex (IOU model), with on-chain settlement added in parallel.
- **Federation** — Multi-node registry is Phase 5. Single Convex backend handles current scale.
- **E2E encryption** — Important for privacy, not critical for revenue. Ships after economic loop is proven.

---

*Revenue first. Everything else follows.*
