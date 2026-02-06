# Flint Road — Legal & Regulatory Considerations

## Critical question: Is Flint Road a money transmitter?

### Short answer

Probably not, if structured correctly using Stripe Connect.

### Long answer

Flint Road holds funds in escrow between task creation and task completion. This looks like money transmission — holding funds on behalf of others and transferring them.

**However**, Stripe Connect is specifically designed to handle this:

**Stripe Connect model:**
- Flint Road is the "platform" in Stripe Connect terminology
- Machine agent owners and human providers are "connected accounts"
- When a task is created, the funds go to Stripe (not to Flint Road's bank account)
- Stripe holds the funds, not Flint Road
- On task completion, Stripe releases funds to the provider's connected account
- Flint Road's 5% fee is collected as a Stripe "application fee"
- Stripe handles: KYC, 1099 reporting, funds holding, disbursement

**Why this matters:** Stripe is the licensed money transmitter. Flint Road is the software platform that tells Stripe when to move money. Flint Road never touches the funds.

This is the same model used by: Uber, Lyft, DoorDash, Airbnb, Shopify, and thousands of other marketplaces. It's well-established regulatory ground.

### What to confirm with a lawyer

1. **State-by-state money transmitter licensing:** Even with Stripe Connect, some states have argued that platforms facilitating payments need their own licenses. Get a legal opinion specific to Flint Road's model.

2. **The escrow hold period:** Short holds (seconds to minutes for M2M tasks) are clearly fine. Longer holds (hours for M2H tasks) may attract more scrutiny. Understand the limits.

3. **International providers:** Human providers in other countries add complexity. Stripe Connect supports international payouts, but each country has its own rules. Start US-only, expand carefully.

**Action:** Consult a fintech lawyer before launch. Budget: $2-5K for an opinion letter. This is not optional.

---

## Agent liability: Who's responsible when an agent does something wrong?

### The principle

**Agent owners are responsible for their agents' actions.** Flint Road is infrastructure.

This is the same model as:
- AWS is not liable for what's hosted on EC2
- Stripe is not liable for what's sold through their payment processing
- Cloudflare is not liable for what's served through their CDN

### Terms of Service requirements

The ToS must clearly state:

1. **Agent owners** are solely responsible for:
   - Tasks their agents create and delegate
   - Budgets and spending their agents incur
   - Content their agents send through the network
   - Compliance with applicable laws for their agents' activities

2. **Human providers** are solely responsible for:
   - Quality and accuracy of their work
   - Holding necessary licenses for professional work (legal, medical, financial advice)
   - Tax obligations on their earnings

3. **Flint Road** provides:
   - Infrastructure for task routing, escrow, and reputation
   - No guarantee of agent or provider performance
   - No review or endorsement of task content
   - Dispute resolution as a service, not as a legal determination

### DMCA / Safe harbor

Flint Road never sees task content (E2E encrypted). This is actually a strong legal position — you can't be liable for content you architecturally cannot access. However, we still need:
- DMCA agent designation (standard)
- Acceptable use policy
- Mechanism to ban providers reported for illegal activity

---

## Human provider classification: Employee or independent contractor?

### The answer: Independent contractor

Human providers on Flint Road:
- Choose which bounties to accept (no assignment)
- Set their own availability (no schedule)
- Set their own prices (within market rates)
- Use their own tools (their phone/computer)
- Work for multiple "clients" simultaneously (multiple agents/owners)
- Have no exclusivity obligation
- Are paid per task, not per hour

This is a textbook independent contractor relationship under IRS guidelines and most state laws.

### What could go wrong

The gig economy classification battles (Uber, DoorDash, AB5 in California) are relevant. Key differences:
- Flint Road doesn't set prices (market determines pricing)
- Flint Road doesn't set schedules (providers choose when to work)
- Flint Road doesn't control how work is done (providers complete tasks their own way)
- Flint Road doesn't provide tools (providers use their own devices)

These distinctions matter. Document them clearly in the provider agreement.

### Tax obligations

**US:**
- Human providers earning $600+ in a calendar year: Flint Road (via Stripe Connect) issues 1099-K
- Stripe Connect handles 1099 generation and reporting
- Flint Road does not withhold taxes — providers are responsible

**International:**
- Each country has different rules
- Start US-only for human providers
- Expand internationally with proper legal review per country

---

## Data privacy

### GDPR

Flint Road's position is strong:
- Task content is E2E encrypted — Flint Road literally cannot access it
- Metadata stored: provider profiles, task routing data, escrow state, reputation
- Provider profiles contain: capabilities, pricing, availability, reputation score
- No personal data in task payloads (from Flint Road's perspective — can't read them)

**Still required:**
- Privacy policy explaining what metadata is collected
- Data processing agreement (DPA) for enterprise customers
- Right to deletion (account and metadata)
- Data portability (reputation scores, transaction history)

### CCPA (California)

Similar to GDPR requirements. Key: disclose what data is collected, provide deletion mechanism.

### SOC 2

Not required at launch. Becomes important for enterprise customers (Phase 4). Timeline: pursue SOC 2 Type I when approaching first enterprise deals (~month 8-10).

---

## Intellectual property

### What we own
- FRTP protocol specification (proprietary initially, open later)
- Flint Road services codebase
- SDK and connectors
- Flint Road brand, name, logos

### What we don't own
- Agent code (belongs to agent owners)
- Task content (E2E encrypted, never accessible)
- Skills (belong to skill creators)
- Human provider work product (belongs to the requester per ToS)

### Trademark

File for:
- "Flint Road" (word mark)
- Logo mark (once finalized)
- "FRTP" (if we plan to make it a standard)
- "H2M2M2H" (consider — it's a strong brand concept)

**Action:** File intent-to-use trademark applications early. Budget: $500-1,500 per mark through an online filing service, or $2-5K through a trademark attorney.

---

## Terms of Service structure

### For agent owners (demand side)
- Account registration and authentication
- Budget responsibility (you control what your agent spends)
- Acceptable use (no illegal tasks, no abuse of human providers)
- Escrow terms (when funds are held, released, refunded)
- Dispute resolution process
- Limitation of liability
- Indemnification (you're responsible for your agent's actions)

### For machine providers (supply side — agent builders)
- Agent registration and capability declarations
- Accuracy of capability claims (don't claim what you can't do)
- Task completion obligations (accept = commit)
- Reputation system rules (no gaming, no sybil attacks)
- Payment terms (5% protocol fee, settlement schedule)
- Suspension and termination

### For human providers (supply side — people)
- Independent contractor agreement
- Task completion standards
- Professional license requirements (for regulated tasks)
- Bounty claiming and completion rules
- Payment terms (instant payout via Stripe, 5% fee)
- Tax responsibility
- Dispute participation
- Background check consent (for high-trust categories)

---

## Immediate legal actions (pre-launch)

| Action | Priority | Est. cost | Timeline |
|---|---|---|---|
| Fintech lawyer consultation on money transmission | Critical | $2-5K | Before first transaction |
| Draft Terms of Service (3 versions) | Critical | $3-8K | Before beta launch |
| Draft Privacy Policy | Critical | $1-2K | Before beta launch |
| File "Flint Road" trademark (intent-to-use) | High | $500-1.5K | Weeks 1-2 |
| Stripe Connect application and setup | High | $0 | Weeks 1-2 |
| DMCA agent designation | Medium | $50 | Before launch |
| Independent contractor agreement template | Medium | $1-2K | Before human provider onboarding |
| Business entity formation (LLC or C-Corp) | Critical | $500-1K | Week 1 |

**Total pre-launch legal budget: $8-20K**

If bootstrapping on a tight budget, prioritize:
1. Business entity ($500)
2. Stripe Connect setup ($0)
3. Fintech lawyer opinion letter ($2-5K)
4. Trademark filing ($500)
5. DIY Terms of Service based on Stripe Connect marketplace templates, then lawyer review later

Minimum viable legal budget: **~$3-5K**

---

## Regulatory watchlist

Things that could become issues at scale:

1. **AI regulation (EU AI Act, state-level US laws):** Flint Road is infrastructure, not an AI itself. But if regulations require AI agent registration or certification, Flint Road might need to facilitate compliance.

2. **Labor law evolution:** If gig economy classification laws tighten (more states following California AB5), human provider model may need adjustment.

3. **Financial regulation:** If Flint Road GMV exceeds certain thresholds, additional financial reporting or licensing may be required even with Stripe Connect.

4. **Export controls:** If agents are used for tasks that touch controlled technologies or embargoed countries, Flint Road may need compliance mechanisms.

5. **Professional licensing:** If agents delegate to human providers for legal, medical, or financial advice, state licensing boards may have opinions.

**Approach:** Monitor, don't preemptively over-comply. Build compliance tooling when regulations are clear, not when they're speculative. The infrastructure-provider positioning (like AWS/Stripe) is the strongest defensive posture.
