# Flint Road — Progress Log

## What this is

**Flint Protocol** — a peer-to-peer protocol for autonomous machine-to-machine and machine-to-human labor delegation. Agents discover each other, negotiate terms, delegate tasks, settle payment, and build reputation — without centralized orchestration.

**Flint Road** (flintroad.com) — the first implementation of Flint Protocol. The product, the SDK, the frontend.

**Naming convention:** "Flint Protocol" = the open spec (public repo). "Flint Road" = the company/product/SDK (private repo, flintroad.com).

**Tagline:** H2M2M2H — Humans at the edges. Machines in the middle. The chain assembles itself.

---

## Completed

### Infrastructure

- [x] Domain registered: **flintroad.com** (via Spaceship, paid with crypto)
- [x] GitHub organization: **github.com/flintroad**
- [x] Private repo: **flintroad/core** — all implementation code
- [x] Public repo: **flintroad/protocol** — whitepaper only
- [x] GitHub CLI authenticated under `flintroad` account
- [x] Convex backend deployed: **dependable-emu-627.convex.site**
- [x] Health check live: `GET /health` → `{"status":"ok","service":"flintroad","version":"0.1.0"}`

### Protocol Specification

- [x] PROTOCOL.md written — Bitcoin whitepaper style, ~3500 words, 12 sections
- [x] Covers: identity, discovery, task lifecycle, E2E encryption, settlement, reputation, recursive delegation, network topology, incentive analysis
- [x] Published to public repo: github.com/flintroad/protocol
- [x] README.md with tagline + link to spec

### Backend (Convex)

- [x] Database schema: agents, apiKeys, tasks, taskReceipts, reputationScores
- [x] Agent registration, update, removal (all `internalMutation`)
- [x] Agent discovery with search index + capability matching
- [x] Task lifecycle: create → accept → complete / fail
- [x] Reputation system with incremental O(1) updates
- [x] REST API via Convex HTTP actions (all `/v1/` endpoints)
- [x] API key auth with SHA-256 hashing (plaintext returned once, never stored)
- [x] Rejection-sampled key generation (no modular bias)

### SDK (TypeScript)

- [x] `FlintRoad` client class — HTTP with AbortController timeouts
- [x] `FlintRoadProvider` — capability handlers, polling, double-processing prevention
- [x] `FlintRoadRequester` — discover + delegate + wait pattern
- [x] Full TypeScript types for all protocol objects
- [x] Builds clean (`tsc --noEmit` passes)

### First Protocol Loop (Genesis Transaction)

- [x] Agent A registered: `fr_agent_3c278m56j7ux` (Research Requester)
- [x] Agent B registered: `fr_agent_pzk1vo3lk3pp` (Web Research Provider)
- [x] Discovery: Agent A found Agent B via `capability=web_research`
- [x] Task created: `fr_task_p3btwbakmbsp` (pending → accepted → completed)
- [x] Task completed with output: BTC price from CoinGecko
- [x] Reputation updated: Agent B score = 0.999, 1/1 tasks successful
- [x] Access control verified: requester can read task, task includes input/output
- [x] Full round-trip time: ~11 seconds (creation to completion)

### Security Hardening (P0/P1 complete)

- [x] All mutations converted to `internalMutation` (no direct client access)
- [x] Task read/write access control (ownership checks on every operation)
- [x] Per-IP rate limiting on all endpoints
- [x] `fail()` requires caller is requester or provider
- [x] Rejection sampling for key generation (eliminates modular bias)
- [x] Pagination on all queries (`.take(limit)`, max 100)
- [x] Reputation calculation is O(1) incremental (not O(n) recalc)
- [x] SDK double-processing prevention (`processingTasks` Set + lock flag)
- [x] Error sanitization (`safeErrorMessage()` allowlist)
- [x] Explicit field picking in HTTP handlers (no raw body spreading)
- [x] AbortController timeouts in SDK (default 30s)
- [x] Timer leak fix in `delegateAndWait` (settled flag)

### Planning Documents (Desktop/FlintRoad/)

- [x] ARCHITECTURE.md — full system architecture
- [x] SECURITY-AUDIT.md — 15 vulnerabilities identified + fixes applied
- [x] LAUNCH-PLAN.md — pseudonymous cypherpunk launch strategy + costs
- [x] CRYPTO-PAYMENTS.md — multi-chain payment rails analysis
- [x] 10X-FUNCTIONALITY.md — 10 features for protocol expansion
- [x] 10X-SECURITY.md — 10 security hardening layers

---

## Not Yet Started

### Phase 2 — Money + Real-time

- [x] ~~Deploy Convex backend~~ (deployed: dependable-emu-627)
- [x] ~~Genesis transaction~~ (completed: fr_task_p3btwbakmbsp)
- [ ] Publish `@flintroad/sdk` to npm
- [ ] E2E encryption (X25519 + XChaCha20-Poly1305) on all task payloads
- [ ] Ed25519 message signatures on every mutation
- [ ] Replay attack prevention (nonce + timestamp)
- [ ] Crypto escrow contracts (USDC on Base, day one)
- [ ] Task streaming (partial results via SSE)
- [ ] Webhooks for non-JS agents

### Phase 3 — Depth

- [ ] Recursive delegation (parentTaskId, budget propagation)
- [ ] Capability schemas (typed inputs/outputs per capability)
- [ ] Human provider interface (web app at app.flintroad.com)
- [ ] Durable rate limiting (Convex table, survives cold starts)
- [ ] Audit logging (append-only event log)
- [ ] Sybil resistance (proof of work on registration)
- [ ] Anomaly detection (cron-based pattern matching)

### Phase 4 — Breadth

- [ ] Standing supply chains (persistent agent relationships)
- [ ] Agent-to-agent messaging (pre-task negotiation)
- [ ] Python SDK (`pip install flintroad`)
- [ ] Go SDK (`go get github.com/flintroad/sdk-go`)
- [ ] Rust SDK (`cargo add flintroad`)
- [ ] SDK supply chain security (signed releases, SBOM, provenance)
- [ ] Sybil resistance layer 2 (stake-to-register)

### Phase 5 — Resilience

- [ ] Federation (multi-node registry, gossip protocol)
- [ ] Zero-knowledge reputation (prove score without revealing identity)
- [ ] Escrow formal verification (Certora/Halmos)
- [ ] Professional security audit (Trail of Bits / OpenZeppelin)
- [ ] Bug bounty program (Immunefi)

---

## Architecture

```
flintroad/
├── convex/                 # Backend (Convex)
│   ├── schema.ts           # Database tables + indexes
│   ├── auth.ts             # Key generation, hashing, rate limiting
│   ├── agents.ts           # Agent CRUD + discovery
│   ├── tasks.ts            # Task lifecycle + reputation updates
│   ├── reputation.ts       # Reputation queries
│   └── http.ts             # REST API (Hono-style HTTP actions)
├── packages/
│   └── sdk/                # @flintroad/sdk (TypeScript)
│       └── src/
│           ├── client.ts   # FlintRoad class (HTTP client)
│           ├── provider.ts # FlintRoadProvider (task handlers)
│           ├── requester.ts# FlintRoadRequester (delegate + wait)
│           ├── types.ts    # All TypeScript types
│           └── index.ts    # Public exports
└── docs/                   # Foundation docs (PRD, brand, legal)
```

## Repos

| Repo | Visibility | Contents |
|---|---|---|
| `flintroad/core` | Private | All code — Convex backend + SDK |
| `flintroad/protocol` | Public | Whitepaper (PROTOCOL.md) only |

## Key Decisions

1. **Convex over Railway/PostgreSQL** — eliminates DB management, gives real-time subscriptions for free, serverless
2. **Crypto over Stripe** — no legal entity needed, global, pseudonymous, micropayments viable, matches protocol ethos
3. **Private code / public whitepaper** — cypherpunk launch: protocol spec is open, implementation is closed until ready
4. **USDC on Base as day-one payment rail** — stable value, lowest gas fees, largest L2 ecosystem
5. **internalMutation everywhere** — prevents Convex client from calling mutations directly, all writes go through HTTP layer with auth
6. **Rejection sampling for key generation** — eliminates modular bias that would make API keys statistically predictable
7. **Incremental reputation** — O(1) updates using running totals, not O(n) recalculation from full receipt history

---

*This file is private. It lives in flintroad/core and is never published.*
