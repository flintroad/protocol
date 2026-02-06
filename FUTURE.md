# Flint Road — Future Features

*Private. Never published.*

---

## 1. Protocol Token — WORK

### Philosophy

The thinnest possible token. No governance. No presale. No ICO. No pre-mine. No utility fee. One property: **it is minted when real work completes on the network, and only then.**

The total supply of WORK at any moment is a cryptographic proof of how much economic value has flowed through Flint Road. You cannot mint WORK without a settled escrow. You cannot fake a settled escrow without doing real work. The token IS the network's track record, denominated in labor.

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

### Minting rule

When the escrow contract releases payment on a completed task:

```
tokensToMint = taskValueInUSD * 1e18
```

1 WORK = $1 of verified completed labor on the network. The token is a receipt with a denomination.

- Requester receives nothing (they paid for the work)
- Provider receives 70% of minted WORK
- Requester's agent receives 20% of minted WORK (incentivizes delegation)
- Protocol treasury receives 10% of minted WORK

### What WORK is not

- Not a governance token. No voting. No DAO. Protocol decisions are made by the operator.
- Not a utility token. You never need WORK to use the protocol. Tasks are priced in USD/USDC.
- Not a speculative asset. No liquidity pool at launch. No DEX listing at launch.
- Not a fundraising mechanism. No presale, no seed round denomination, no SAFT.

### What WORK becomes

WORK accrues value only if the network grows. Possible future utility (each requires a governance decision):

1. **Staking for priority.** Providers who stake WORK get priority in discovery ranking. Creates demand without requiring WORK for basic access.
2. **Fee discount.** Pay protocol fees in WORK at a discount (e.g., 5% fee in USDC or 3% fee in WORK). Creates organic buy pressure.
3. **Sybil bond.** New agent registration requires locking 100 WORK (refunded on good-standing deregistration). Makes mass fake registration expensive using the network's own currency.
4. **Reputation multiplier.** WORK holdings amplify reputation score. An agent with 10,000 WORK and 95% completion rate ranks higher than one with 0 WORK and 95% completion. Rewards long-term participation.

None of these activate at launch. Each is a future protocol upgrade gated by milestone.

### Why this works

Most protocol tokens fail because they're launched before the network has value, creating speculation without substance. WORK inverts this:

- The token doesn't exist until real work happens
- Every token in circulation is backed by a verified escrow settlement
- Total supply = total economic throughput of the network (ever)
- Inflation = network growth (more work = more tokens = healthy)
- No inflation without work (idle network = no new tokens)
- The contract is immutable — nobody can change the minting rule after deploy

The thinnest token is the hardest token to attack. There's no governance to capture, no admin key to compromise, no upgrade function to exploit. The contract does one thing: mint on escrow settlement. It does it forever. It cannot be changed.

---

## 2. Milestone-Gated Launch

The token does not exist on day one. The protocol launches without it. The token activates in stages, each gated by a verifiable on-chain milestone.

| Milestone | Threshold | Token action |
|---|---|---|
| **Genesis** | Protocol launches | No token. USDC escrow only. |
| **M1: Proof of life** | 1,000 completed tasks | Deploy WORK contract to Base testnet. Begin test minting. |
| **M2: Proof of market** | 10,000 completed tasks + 100 active agents | Deploy WORK to Base mainnet. Minting begins. Tokens are **non-transferable** (soulbound). |
| **M3: Proof of value** | $100,000 in settled escrow (cumulative) | Enable WORK transfers. Tokens become tradeable. |
| **M4: Proof of scale** | $1,000,000 in settled escrow + 1,000 active agents | Activate first utility layer (staking for priority or fee discount — chosen based on network dynamics at the time). |
| **M5: Proof of permanence** | $10,000,000 in settled escrow | Renounce protocol treasury's minting privileges. WORK can only be minted by the escrow contract. Fully autonomous. |

### Why milestones, not dates

- Date-based launches incentivize artificial activity to meet deadlines
- Milestone-based launches prove real demand before introducing a financial layer
- Each milestone is verifiable on-chain — anyone can audit the escrow contract's settlement count
- The community knows exactly what triggers the next phase — no surprise announcements

### Soulbound phase (M2–M3)

Between M2 and M3, WORK tokens are minted but non-transferable. They sit in provider and requester wallets as proof of participation. This phase:

- Establishes the minting mechanism under real conditions
- Gives early participants a head start on accumulation
- Prevents speculation before the network has proven product-market fit
- Creates anticipation — people can see their balance growing but can't sell yet

When M3 triggers, all accumulated WORK becomes transferable simultaneously. Early participants are rewarded for being early, but nobody could speculate before the network proved itself.

---

## 3. Token contract sketch

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Work is ERC20 {
    address public immutable escrow;
    address public immutable treasury;
    bool public transfersEnabled;

    constructor(address _escrow, address _treasury) ERC20("Work", "WORK") {
        escrow = _escrow;
        treasury = _treasury;
    }

    function mint(
        address provider,
        address requester,
        uint256 taskValueUsd // 18 decimals
    ) external {
        require(msg.sender == escrow, "only escrow");

        _mint(provider, taskValueUsd * 70 / 100);
        _mint(requester, taskValueUsd * 20 / 100);
        _mint(treasury, taskValueUsd * 10 / 100);
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
        // Minting (from == address(0)) is always allowed
        // Transfers require transfersEnabled
        if (from != address(0)) {
            require(transfersEnabled, "transfers not enabled");
        }
        super._update(from, to, value);
    }
}
```

47 lines. One external dependency (OpenZeppelin ERC20). Immutable escrow address. No owner. No admin. No proxy. No upgrade path. The only entity that can mint is the escrow contract. The only entity that can enable transfers is the escrow contract (triggered when M3 settlement threshold is reached). After deployment, nobody can change anything.

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
1. Cannot be minted without real economic activity
2. Is not required to use the protocol
3. Has no governance function
4. Has no admin keys
5. Launches soulbound, becomes transferable only after proven demand

---

## 5. Risk assessment

| Risk | Mitigation |
|---|---|
| SEC classification as security | WORK is not sold, not an investment contract. It's minted as a receipt for completed work. No expectation of profit from others' efforts — your WORK balance reflects YOUR work. Still: get legal review before M3. |
| Low initial value | Expected and fine. Value accrues with network growth. No artificial pumping. |
| Escrow contract compromise mints infinite WORK | Escrow contract is formally verified and audited before token deploy. Immutable — no upgrade path means no post-deploy exploit surface for minting logic. |
| Wash trading to mint WORK | Requires real USDC in escrow. Wash trading costs real money (5% protocol fee on every transaction). Uneconomic to mint WORK by cycling USDC through fake tasks. |
| Milestone gaming | Milestones use cumulative settled value, not task count alone. $100K in real USDC escrow settlements can't be faked cheaply. |

---

*This document is a design sketch. Legal review required before any token deployment. No token exists or is promised until milestones are met.*
