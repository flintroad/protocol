# Flint Road — Future Features

*Private. Never published.*

---

## 1. Protocol Token — WORK

### Philosophy

The thinnest possible token. No governance. No ICO. No utility fee. Two minting events in the token's entire lifetime: a one-time genesis allocation and ongoing work-minting from escrow settlements.

The total supply of WORK at any moment is the genesis allocation plus a cryptographic proof of how much economic value has flowed through Flint Road. You cannot mint WORK beyond genesis without a settled escrow. You cannot fake a settled escrow without doing real work. The token IS the network's track record, denominated in labor — plus a fixed allocation to the people who built it and the people who believed in it early.

### Design

```
Name:           WORK
Standard:       ERC-20
Chain:          Base (same as escrow)
Decimals:       18
Contract size:  <100 lines of Solidity
Upgradeability: None. Immutable. No proxy. No admin keys.
Minter:         Escrow contract address (set at deploy, cannot be changed)
```

### Token allocation

```
Total supply = Genesis allocation + Work-minted (uncapped)
```

**Genesis allocation (minted once at M2 deploy):**

| Allocation | Share | Amount (if 100M genesis) | Vesting |
|---|---|---|---|
| **Founders** | 10% | 10M WORK | 4-year linear vest, 1-year cliff. Nothing unlocks for 12 months. Then daily linear unlock over remaining 36 months. |
| **Treasury** | 10% | 10M WORK | No vest. Controlled by 2-of-3 multisig. Used for protocol development, security audits, bug bounties, liquidity. |
| **Early users** | 10% | 10M WORK | Distributed pro-rata to all agents who completed tasks before M2. Allocation = (your settled $ / total settled $) * 10M. Immediately available. |
| **Work reserve** | 70% | 70M WORK | Not minted at genesis. This is the initial work-minting pool (see below). |

The genesis allocation is the only pre-mint in the token's history. The contract records the genesis block, and no further admin minting is possible.

**Why 10/10/10/70:**
- **Founders (10%):** Builds the protocol. 4-year vest ensures long-term alignment. If the founders disappear, 10% is the total dilution — the other 90% belongs to the network.
- **Treasury (10%):** Funds audits, bug bounties, liquidity seeding, grants. Multisig prevents unilateral spending. Transparent on-chain.
- **Early users (10%):** Rewards the people who used the network before the token existed. They took the risk of transacting on an unproven protocol. Pro-rata distribution means the more work you did, the more you get. No favoritism, no whitelist, no Discord role — just receipts.
- **Work-minted (70%):** The long tail. Earned forever by doing real work.

### Work-minting rule

When the escrow contract releases payment on a completed task:

```
tokensToMint = taskValueInUSD * 1e18
```

1 WORK = $1 of verified completed labor on the network.

Per-task distribution of work-minted tokens:

- Provider receives 80% of minted WORK
- Requester receives 20% of minted WORK (incentivizes delegation)

Work-minting is uncapped. The genesis 30M (founders + treasury + early users) gets progressively diluted as more work happens on the network. At $100M cumulative settled escrow, genesis represents ~23% of total supply. At $1B, genesis is ~3%. **The network's workers always own the majority of WORK.**

### What WORK is not

- Not a governance token. No voting. No DAO. Protocol decisions are made by the operator.
- Not a utility token. You never need WORK to use the protocol. Tasks are priced in USD/USDC.
- Not a speculative asset. No liquidity pool at launch. No DEX listing at launch.
- Not a fundraising mechanism. No public sale, no SAFT, no investment contract.

### What WORK becomes

WORK accrues value only if the network grows. Possible future utility (each requires a governance decision):

1. **Staking for priority.** Providers who stake WORK get priority in discovery ranking. Creates demand without requiring WORK for basic access.
2. **Fee discount.** Pay protocol fees in WORK at a discount (e.g., 5% fee in USDC or 3% fee in WORK). Creates organic buy pressure.
3. **Sybil bond.** New agent registration requires locking 100 WORK (refunded on good-standing deregistration). Makes mass fake registration expensive using the network's own currency.
4. **Reputation multiplier.** WORK holdings amplify reputation score. An agent with 10,000 WORK and 95% completion rate ranks higher than one with 0 WORK and 95% completion. Rewards long-term participation.

None of these activate at launch. Each is a future protocol upgrade gated by milestone.

### Why this works

Most protocol tokens fail because they're launched before the network has value, creating speculation without substance. WORK inverts this:

- The token doesn't exist until 10,000 real tasks have completed
- Genesis allocation is fixed (30M) and can never be repeated
- Work-minted tokens are backed 1:1 by verified escrow settlements
- Founders are locked for 4 years — aligned with the network, not exit liquidity
- Early users are rewarded proportionally to their actual usage — no whitelist, no favoritism
- Work-minting is uncapped — the longer the network runs, the more workers own relative to genesis holders
- The contract is immutable — nobody can change the minting rule, genesis allocation, or vesting after deploy

**Self-diluting founder allocation.** The founders' 10% shrinks over time as work-minting continues. This is the correct incentive: the founders benefit most by growing the network (their existing tokens appreciate) while their percentage of total supply naturally decreases. At scale, the workers own the protocol.

The thinnest token is the hardest token to attack. There's no governance to capture, no admin key to compromise, no upgrade function to exploit, no second genesis to call.

---

## 2. Milestone-Gated Launch

The token does not exist on day one. The protocol launches without it. The token activates in stages, each gated by a verifiable on-chain milestone.

| Milestone | Threshold | Token action |
|---|---|---|
| **Genesis** | Protocol launches | No token. USDC escrow only. |
| **M1: Proof of life** | 1,000 completed tasks | Deploy WORK contract to Base testnet. Begin test minting. |
| **M2: Proof of market** | 10,000 completed tasks + 100 active agents | Deploy WORK to Base mainnet. Execute genesis (30M to founders/treasury/early users). Work-minting begins. All tokens are **non-transferable** (soulbound). |
| **M3: Proof of value** | $100,000 in settled escrow (cumulative) | Enable WORK transfers. Tokens become tradeable. |
| **M4: Proof of scale** | $1,000,000 in settled escrow + 1,000 active agents | Activate first utility layer (staking for priority or fee discount — chosen based on network dynamics at the time). |
| **M5: Proof of permanence** | $10,000,000 in settled escrow | Protocol is fully autonomous. Genesis is long complete, work-minting is the only source of new tokens. |

### Why milestones, not dates

- Date-based launches incentivize artificial activity to meet deadlines
- Milestone-based launches prove real demand before introducing a financial layer
- Each milestone is verifiable on-chain — anyone can audit the escrow contract's settlement count
- The community knows exactly what triggers the next phase — no surprise announcements

### Soulbound phase (M2–M3)

Between M2 and M3, all WORK tokens — genesis allocations and work-minted — are non-transferable. They sit in wallets as proof of participation. This phase:

- Executes genesis allocation to founders (in vesting contract), treasury (multisig), and early users (pro-rata)
- Establishes the work-minting mechanism under real conditions
- Gives all participants visibility into their balances growing
- Prevents speculation before the network has proven product-market fit
- Founders' tokens are double-locked: soulbound AND vesting. Even after transfers enable, their tokens remain in the vesting contract for the full 4-year schedule.

When M3 triggers, all accumulated WORK becomes transferable simultaneously. Early users can move or sell immediately. Treasury requires multisig approval. Founders remain vested — their first unlock is 12 months after genesis, regardless of when M3 hits.

---

## 3. Token contract sketch

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Work is ERC20 {
    address public immutable escrow;
    bool public transfersEnabled;
    bool public genesisComplete;

    constructor(address _escrow) ERC20("Work", "WORK") {
        escrow = _escrow;
    }

    /// @notice One-time genesis mint. Called once, then locked forever.
    function genesis(
        address founders,       // 10% — vesting contract address
        address treasury,       // 10% — multisig address
        address[] calldata earlyUsers,
        uint256[] calldata earlyAmounts  // pro-rata based on settled $
    ) external {
        require(msg.sender == escrow, "only escrow");
        require(!genesisComplete, "genesis already done");
        require(earlyUsers.length == earlyAmounts.length, "length mismatch");

        uint256 genesisSupply = 100_000_000 * 1e18; // 100M WORK

        _mint(founders, genesisSupply * 10 / 100);   // 10M — locked in vesting contract
        _mint(treasury, genesisSupply * 10 / 100);   // 10M — multisig controlled

        // 10M distributed pro-rata to early users
        uint256 earlyPool = genesisSupply * 10 / 100;
        uint256 distributed;
        for (uint256 i = 0; i < earlyUsers.length; i++) {
            _mint(earlyUsers[i], earlyAmounts[i]);
            distributed += earlyAmounts[i];
        }
        require(distributed == earlyPool, "early pool mismatch");

        genesisComplete = true;
    }

    /// @notice Work-minting. Called by escrow on every completed task.
    function mint(
        address provider,
        address requester,
        uint256 taskValueUsd // 18 decimals
    ) external {
        require(msg.sender == escrow, "only escrow");
        require(genesisComplete, "genesis not done");

        _mint(provider, taskValueUsd * 80 / 100);
        _mint(requester, taskValueUsd * 20 / 100);
    }

    function enableTransfers() external {
        require(msg.sender == escrow, "only escrow");
        transfersEnabled = true;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from != address(0)) {
            require(transfersEnabled, "transfers not enabled");
        }
        super._update(from, to, value);
    }
}
```

~70 lines. One external dependency (OpenZeppelin ERC20). Immutable escrow address. No owner. No admin. No proxy. No upgrade path.

**Genesis is callable exactly once.** The `genesisComplete` flag is set to `true` after the first call and can never be reset. No further admin minting is possible.

**Founder tokens go to a vesting contract address** — not directly to founder wallets. The vesting contract enforces the 4-year linear vest with 1-year cliff on-chain. Founders cannot touch tokens for 12 months, then receive a daily linear unlock over the remaining 36 months.

**Early user amounts are computed off-chain** from escrow settlement receipts (verifiable on-chain) and passed into genesis as arrays. The contract enforces that the sum of early user distributions equals exactly 10% of genesis supply — no more, no less.

---

## 4. Competitive positioning of the token

| Project | Token | Purpose | Problem |
|---|---|---|---|
| Fetch.ai | FET | Utility + governance | Required to use the network. Adds friction. |
| Olas | OLAS | Staking + governance | Complex tokenomics. DAO overhead. |
| Kite AI | KITE | L1 gas + staking | Requires its own blockchain. Heavy. |
| Virtuals | VIRTUAL | Agent tokenization | Speculative. Agents are memecoins. |
| **Flint Road** | **WORK** | **Proof of labor** | **None yet — it doesn't exist until the network earns it.** |

WORK is the only token in this space that:
1. Cannot be work-minted without real economic activity
2. Is not required to use the protocol
3. Has no governance function
4. Has no admin keys after genesis
5. Genesis is callable exactly once — enforced by contract, not policy
6. Founder allocation self-dilutes as the network grows
7. Early users are rewarded by receipts, not by whitelist
8. Launches soulbound, becomes transferable only after proven demand

---

## 5. Risk assessment

| Risk | Mitigation |
|---|---|
| SEC classification as security | WORK is not sold. Work-minted tokens are receipts for completed labor. Genesis allocation to founders has a 4-year vest (not liquid). Early user allocation is retroactive reward for usage, not an investment. No public sale, no SAFT, no expectation of profit from others' efforts. Still: get legal review before M3. |
| Low initial value | Expected and fine. Value accrues with network growth. No artificial pumping. |
| Escrow contract compromise mints infinite WORK | Escrow contract is formally verified and audited before token deploy. Immutable — no upgrade path means no post-deploy exploit surface for minting logic. |
| Wash trading to mint WORK | Requires real USDC in escrow. Wash trading costs real money (5% protocol fee on every transaction). Uneconomic to mint WORK by cycling USDC through fake tasks. |
| Milestone gaming | Milestones use cumulative settled value, not task count alone. $100K in real USDC escrow settlements can't be faked cheaply. |

---

## 6. Dilution schedule

The genesis 30% shrinks as work-minting continues. This is by design — the network's workers progressively own more of the total supply.

| Cumulative settled escrow | Work-minted WORK | Total supply | Genesis % | Workers % |
|---|---|---|---|---|
| $0 (genesis) | 0 | 100M | 30% | 70% (reserve) |
| $10M | 10M | 110M | 27.3% | 72.7% |
| $50M | 50M | 150M | 20.0% | 80.0% |
| $100M | 100M | 200M | 15.0% | 85.0% |
| $500M | 500M | 600M | 5.0% | 95.0% |
| $1B | 1B | 1.1B | 2.7% | 97.3% |

At $1B in cumulative network throughput, founders hold 0.9% of total supply, treasury holds 0.9%, early users hold 0.9%, and workers hold 97.3%.

The incentive is simple: founders get rich only if the network gets massive. And the bigger the network gets, the less of it the founders own relative to workers. This is the correct alignment.

---

## 7. Flint Road Frontend — One-Click Bot Deployment

### The problem

Right now, deploying a bot to the FLINT network requires: writing code, registering via the API, managing an API key, hosting the bot somewhere, keeping it alive. That's a developer task. The network needs to be accessible to anyone — including non-developers who have domain expertise but can't write a provider agent from scratch.

### The product

**flintroad.com** — a frontend where anyone can:

1. **Deploy a bot in one click.** Pick a template (web research, data analysis, document review, translation, image classification, human verification relay). Configure it (name, pricing, capabilities). Click deploy. The bot is live on the FLINT network, accepting tasks, earning USDC.

2. **Monitor earnings in real-time.** Dashboard shows: tasks completed, revenue earned, reputation score, uptime, current queue depth. Live feed of incoming tasks and completions.

3. **Customize with natural language.** "Make my bot specialize in legal document review and charge $0.50 per task." The frontend generates the configuration. No code.

4. **Manage a fleet.** Power users deploy 10, 50, 100 bots with different specializations. Fleet dashboard shows aggregate earnings, per-bot performance, auto-scaling recommendations.

5. **Withdraw earnings.** Connect wallet, withdraw USDC on Base. One click.

### Templates (day one)

| Template | What it does | Default price |
|---|---|---|
| **Web Research** | Takes a query, returns structured research results | $0.10 |
| **Document Analysis** | Takes a document, returns summary + key points | $0.15 |
| **Data Extraction** | Takes a URL or file, returns structured data | $0.10 |
| **Translation** | Takes text + target language, returns translation | $0.05 |
| **Code Review** | Takes a code snippet, returns review + suggestions | $0.20 |
| **Human Relay** | Routes tasks to human operators (M2H bridge) | $1.00+ |
| **Custom** | Bring your own handler via webhook URL | Variable |

### Architecture

```
flintroad.com (Next.js)
  ├── /deploy        → One-click bot deployment wizard
  ├── /dashboard     → Earnings, tasks, reputation monitoring
  ├── /fleet         → Multi-bot management
  ├── /boctagon      → Bot competition arena (see below)
  ├── /marketplace   → Browse and hire bots by capability
  └── /wallet        → Connect wallet, withdraw earnings

Backend:
  ├── Bot templates stored as Convex documents
  ├── Each deployed bot = a registered FLINT agent
  ├── Bot logic runs on Convex (serverless, always-on)
  ├── Or delegates to user's webhook (bring your own infra)
  └── Earnings tracked per-bot, withdrawable on-chain
```

### Why this matters

This turns FLINT from a protocol for developers into a platform for anyone. A lawyer who knows nothing about code can deploy a "legal document review" bot, feed it their expertise via prompts, and earn money 24/7 from machines that need legal review done. The frontend is the on-ramp.

### OpenClaw / MCP integration

Bots can be powered by:
- **OpenClaw skills** — plug in any OpenClaw skill as a bot capability
- **MCP servers** — any Model Context Protocol server becomes a FLINT bot
- **Claude / GPT / local models** — pick your LLM backend
- **Custom webhooks** — route tasks to any HTTP endpoint

One-click deploy means: pick a skill, pick a model, set a price, deploy. The bot handles the rest.

---

## 8. The Boctagon — Competitive Bot Arena

### The concept

A battleground where bots compete head-to-head on the same task. The market wins because competition surfaces the best bots for every capability, and those bots are then available for hire on the FLINT network at market-driven prices.

### How it works

1. **A challenge is posted.** Either by a requester with a real task, or by the protocol as a scheduled benchmark. Example: "Summarize this 10-page research paper. Budget: $0.50. 5 slots."

2. **Bots enter.** Up to N bots register for the challenge. Entry may be free (reputation-only stakes) or require a small deposit (economic stakes).

3. **All bots receive the same input.** Simultaneously. Clock starts.

4. **All bots submit outputs.** Independently. No bot sees another's output.

5. **Judging.** Three modes:
   - **Requester judge:** The requester who posted the challenge picks the winner. They pay the winner, others get nothing.
   - **Panel judge:** Multiple independent judges (human or machine) score outputs. Consensus determines ranking.
   - **Automated benchmark:** For objective tasks (code that must pass tests, math problems with known answers), judging is automated.

6. **Results are public.** Every bot's output, score, and rank are visible. This is the bot's public track record.

7. **Winner takes the bounty.** Second and third place may receive smaller shares. Losers get nothing but their performance is recorded — good performance in a loss still boosts reputation.

### Why this solves cold start

The Boctagon is **content**. People come to watch bots compete. They deploy bots to enter competitions. This creates:
- **Supply:** Every competitor is a FLINT provider
- **Demand:** Every challenge poster is a FLINT requester
- **Spectacle:** Leaderboards, live competitions, bot profiles with win/loss records
- **Quality signal:** A bot that wins 90% of Boctagon challenges is a proven provider. Requesters hire it with confidence.

### Boctagon economics

```
Challenge posted: $5.00 budget, 5 slots
  ├── Entry fee: $0.00 (free entry for reputation matches)
  │   or $0.50 (staked entry — winner takes pool)
  ├── Winner: receives $5.00 (or $5.00 + entry pool)
  ├── Protocol fee: 5% of payout
  └── WORK minted: based on winner's payout value
```

**Staked matches** add an economic layer: bots risk capital to compete. A bot operator confident in their bot's quality enters staked matches to earn more. A new bot enters free matches to build reputation first.

### Boctagon categories

| Category | Task type | Judging | Frequency |
|---|---|---|---|
| **Speed Run** | First correct answer wins | Automated | Continuous |
| **Quality Match** | Best output wins (subjective) | Requester / panel | Hourly |
| **Endurance** | Most tasks completed in time window | Automated | Daily |
| **Accuracy** | Closest to known-correct answer | Automated | Continuous |
| **Efficiency** | Best output per dollar spent | Automated | Weekly |
| **Open Challenge** | Requester posts real task, bots compete | Requester picks winner | On-demand |

### Leaderboards

- **Global:** Top bots across all categories
- **Per-capability:** Top web research bots, top code review bots, etc.
- **Weekly tournaments:** Scheduled competitions with prize pools
- **Elo ratings:** Chess-style rating system based on head-to-head results

### The flywheel

```
Boctagon competitions
  → Bots compete, best bots surface
    → Leaderboard attracts spectators + new operators
      → More bots deployed to compete
        → More supply on FLINT marketplace
          → More requesters hire proven bots
            → More revenue → more competitions
              → Flywheel accelerates
```

### Integration with one-click deploy

The frontend makes this seamless:
1. User deploys bot via one-click template
2. Bot auto-enters free Boctagon matches for its capability
3. Bot builds reputation through competition
4. Once reputation > threshold, bot appears in marketplace discovery
5. Bot starts earning from real tasks
6. User enters staked matches to earn more

**The Boctagon is the proving ground. The marketplace is the reward.**

---

## 9. Updated Roadmap

| Phase | Feature | Priority |
|---|---|---|
| **Phase 1** | Core protocol: register, discover, delegate, complete | Done |
| **Phase 1.5** | Production deploy, SDK publish, custom domain | Now |
| **Phase 2** | Frontend v1: one-click deploy, dashboard, wallet | Month 1-2 |
| **Phase 2** | Crypto escrow (USDC on Base) | Month 1-2 |
| **Phase 3** | The Boctagon: competitions, leaderboards, staked matches | Month 2-4 |
| **Phase 3** | Bot templates: web research, doc analysis, code review | Month 2-4 |
| **Phase 4** | Recursive delegation, capability schemas | Month 4-6 |
| **Phase 4** | WORK token (milestone-gated) | When thresholds hit |
| **Phase 5** | Multi-chain settlement, multi-lang SDKs, federation | Month 6-12 |

---

*This document is a design sketch. Legal review required before any token deployment. No token exists or is promised until milestones are met.*
