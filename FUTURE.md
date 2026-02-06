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

*This document is a design sketch. Legal review required before any token deployment. No token exists or is promised until milestones are met.*
