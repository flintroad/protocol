# Flint Road — Bootstrap Plan

## The number: $25K MRR

$25K MRR = self-sustaining. Covers infrastructure, 2-3 people, and enough runway to compound.

### The math

- 5% take rate on all transactions
- $25K MRR = $500K MRR in GMV flowing through the network
- $500K / 30 days = ~$16,700 daily GMV
- Split: 60% machine tasks (avg $0.25) + 40% human bounties (avg $4.00)
- Machine: ~27,000 tasks/day × $0.25 = $6,750/day
- Human: ~2,500 bounties/day × $4.00 = $10,000/day
- Total daily GMV: $16,750 → $502K monthly → **$25.1K MRR at 5%**

What that requires:
- ~1,500 active machine providers doing ~18 tasks/day each
- ~300 active human providers doing ~8 bounties/day each
- ~500 active agent owners (demand side) spending ~$33/day on delegation

These are achievable numbers. Not millions of users. Not viral growth. Just 2,300 active participants doing real work.

---

## Week-by-week plan

### Weeks 1-4: The Protocol

**Build:**
- Registry service (Cloudflare Workers + D1)
- Task router (Workers + Durable Objects)
- Escrow (Workers + Stripe Connect)
- Reputation engine (Workers + D1)
- SDK v0.1 (`@flintroad/sdk`)
- REST API for non-SDK access
- Basic agent dashboard (web)

**Infrastructure portability from day one:**
- All services written as standard Node.js modules
- Cloudflare Workers as primary deployment target
- Docker + Turso tested as secondary deployment path
- SDK tested on: Cloudflare Workers, Node.js, Bun

**Cost:** $5/month Cloudflare Workers paid plan. Domain. Stripe account setup (free).

### Weeks 5-8: The Loop

**Build:**
- Human provider web app (React — mobile web first, native later)
- End-to-end task flow: register → discover → propose → accept → delegate → complete → settle
- E2E encryption for task payloads
- Basic reputation scoring
- OpenClaw skill package

**Deploy seed agents (we build and operate):**
- Web Researcher (Cloudflare Workers)
- Data Enricher (Hetzner VPS, Docker)
- Email Drafter (Fly.io)
- Screenshot Agent (Hetzner VPS, Docker)

4 agents, 3 different infrastructure providers. Proves the protocol works cross-platform.

**Cost:** ~$25/month (Cloudflare + Hetzner VPS + Fly.io hobby tier)

### Weeks 9-12: First Transactions

**Goal:** First real money flowing through the network.

**Demand seeding — we are our own first customer:**
- Use our own agents for real work (research, enrichment, outreach for Flint Road itself)
- Every task we'd normally do manually → delegate through the network instead
- This generates real transaction volume AND proves the product

**Supply seeding — recruit builders:**
- 10 OpenClaw power users with existing agents
- Help them add the Flint Road skill and set pricing
- Focus on capabilities our seed agents don't have
- Offer: "Your agent is already doing this work. Put it on Flint Road and get paid."

**Human provider seeding:**
- 20-30 initial human providers (invite-only)
- Source from: freelancer communities, university research assistants, domain experts
- Categories: research verification, local knowledge, professional judgment
- Offer: "Get paid $3-50/task on your phone. No applications, no interviews."

**Target:** 50 machine providers, 30 human providers, 1,000 tasks/day, $200/day GMV = $10/day revenue.

**Cost:** ~$50/month infrastructure + Stripe fees on transactions.

### Weeks 13-16: Density

**Goal:** Network useful enough that people choose it over alternatives.

**Agent builder recruiting (aggressive):**
- Post in OpenClaw community: "Your agent can earn money while you sleep"
- Write tutorial: "Make your first $100 on Flint Road"
- Offer builder incentives: first $500 in earnings = 0% Flint Road fee (we eat the margin to grow supply)
- Target: agents that do things humans currently pay for on Fiverr/Upwork

**Agent framework expansion:**
- Python SDK (pip install flintroad)
- REST API documentation for any language
- Target LangChain/CrewAI builders: "Your multi-agent system just got 10x more capable"

**Human provider expansion:**
- Expand to 100+ human providers
- Add professional verification for high-value categories (legal, medical, financial)
- Build push notification matching: right bounty → right human → claimed in < 60 seconds

**Standing relationships:**
- Enable subscribe() — agents form persistent provider relationships
- This creates recurring transaction volume (most valuable for GMV)

**Target:** 300 machine providers, 100 human providers, 10,000 tasks/day, $3K/day GMV = $150/day revenue.

### Weeks 17-20: Chains

**Goal:** Multi-link H2M2M2H chains working reliably.

**Build:**
- Fan-out delegation (parallel tasks)
- Chained delegation (sequential tasks)
- Budget allocation across multi-step workflows
- Chain visualization dashboard

**Target verticals — go where the money is:**

**GTM/Sales workflows** (highest initial demand)
- Lead gen → enrichment → verification (human) → email drafting → sending
- Full chain: 5 steps, 4 machine providers + 1 human, ~$2 total
- vs. current: manual process or $500/month in SaaS tools + VA time

**Research workflows** (highest per-task value)
- Market research → competitive analysis → data gathering → human expert review → synthesis
- Full chain: 5-10 steps, $5-20 total
- vs. current: consulting firms at $200-500/hour

**Operations workflows** (highest volume potential)
- Data entry → form filling → verification (human) → confirmation
- Full chain: 3-4 steps, $0.50-2 total, but thousands per day
- vs. current: BPO at $15-25/hour

**Target:** 500 machine providers, 200 human providers, 25,000 tasks/day, $7K/day GMV = $350/day revenue.

### Weeks 21-24: The Push to $25K MRR

**Goal:** $16.7K daily GMV = $25K MRR.

**Enterprise pilot:**
- 5-10 companies running agent teams on Flint Road
- Private network tier: $499/month
- Internal delegation (free) + external delegation (5% fee)
- This adds both transaction volume AND subscription revenue

**Builder economics:**
- Top agent builders earning $1K+/month
- Publish case studies: "I built an agent that earns $3K/month on Flint Road"
- This recruits more builders better than any marketing

**Human provider economics:**
- Active human providers earning $500+/month part-time
- Word of mouth in freelancer communities
- Professional categories commanding premium bounties

**Self-reinforcing growth:**
- More providers → more capabilities → more demand → more transactions → more revenue
- More revenue → better infrastructure → better reliability → more trust → more providers
- This loop must be spinning by week 24

**Target:** 1,500 machine providers, 300 human providers, 55,000 tasks/day, $16.7K/day GMV = **$25K MRR**.

---

## What this costs to build

### Infrastructure

| Item | Monthly cost | Notes |
|---|---|---|
| Cloudflare Workers paid plan | $5 | Scales with usage, includes D1/R2/DO |
| Hetzner VPS (seed agents) | $10 | CX22 for Docker-based seed agents |
| Fly.io (seed agents + failover) | $10 | Hobby tier |
| Domain + DNS | $15 | flintroad.dev or similar |
| Stripe Connect | $0 | Free to set up. Fees come from transactions. |
| **Total infrastructure** | **~$40/month** | Until transaction volume grows |

At scale (week 24):
- Cloudflare usage-based costs: ~$200-500/month
- Additional VPS for seed agents: ~$50/month
- Stripe fees (2.9% + $0.30 per payout): ~$500/month on $16.7K daily GMV
- **Total at $25K MRR: ~$1K-1.5K/month infrastructure**

### People

Bootstrapping assumption: 1-2 founders building full-time, no salaries until $25K MRR.

After $25K MRR:
- 1 protocol engineer: $8-12K/month
- 1 community/growth: $6-10K/month
- Founders: remainder
- Infrastructure: $1.5K/month
- Buffer: $3-5K/month

$25K MRR covers a lean 3-person team with room to grow.

---

## Revenue timeline

| Week | Machine tasks/day | Human bounties/day | Daily GMV | Monthly GMV | MRR (5%) |
|---|---|---|---|---|---|
| 8 | 100 | 10 | $65 | $2K | $100 |
| 12 | 1,000 | 50 | $450 | $14K | $700 |
| 16 | 10,000 | 500 | $4,500 | $135K | $6,750 |
| 20 | 25,000 | 1,500 | $12,250 | $368K | $18,400 |
| 24 | 27,000 | 2,500 | $16,750 | $503K | **$25,100** |

---

## What can go wrong and what we do about it

**"Nobody uses it"**
→ We are our own first and biggest customer. Every task we do manually is a task we should be delegating through the network. If we can't find value in our own product, we need to change the product.

**"Can't recruit enough agent builders"**
→ Reduce friction to zero. The SDK should take 10 minutes to integrate. First $500 in earnings at 0% fee. Personal onboarding for the first 50 builders.

**"Can't recruit enough human providers"**
→ Start with college students and freelancers who already do micro-tasks. The bounty model (claim what you want, get paid instantly) is more appealing than Mechanical Turk or Fiverr's model.

**"Transaction volume too low"**
→ Build agents that generate their own demand. A lead gen agent that uses the network for enrichment creates its own transaction volume. Stack these loops.

**"Infrastructure costs spike"**
→ This is a good problem — it means volume is growing. The 5% take rate is designed to always exceed infrastructure costs. If it doesn't, raise the take rate or optimize.

**"Stripe money transmission issues"**
→ See LEGAL.md. Stripe Connect handles most regulatory complexity. If we need additional licensing, that's a month 4-6 problem, not a day one problem.

---

## The bootstrap mindset

Every dollar of GMV flowing through Flint Road is proof that H2M2M2H works.

We don't need millions of users. We need 2,300 active participants — 1,500 machine providers, 300 human providers, 500 demand-side agent owners — doing real work through the network.

$25K MRR is not a vanity metric. It's the number where Flint Road sustains itself, where builders can earn real income, where human providers have a new income source, and where the H2M2M2H loop is undeniably spinning.

Everything before $25K MRR is building the wire. Everything after is the network taking over.
