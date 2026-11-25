# Threat model

Assets: escrow tokens, wallet keys, upgrade/management/arbitration authorities, agreement files, and future backend data.

## Boundaries and protections

- Browser ↔ injected wallet: explicit signatures; no private keys collected. Wallet injection/phishing remains a risk. Verify program, mint, network and wallet previews independently.
- Browser ↔ same-origin RPC proxy ↔ Solana: fixed upstream, method allowlist, request size bound, origin check, per-instance throttling; client verifies genesis/mint and confirmed status. A malicious RPC can still lie. High-assurance use needs independent reconciliation, trusted providers and monitoring.
- Program initialization: singleton config requires matching upgrade authority via the actual program's ProgramData account. Operator-selected mint identity is a governance responsibility; six decimals alone does not prove USDC.
- Token settlement: recorded vault/mint and recipient ownership constraints; buyer or authorized arbitrator signatures; terminal states prevent ordinary double payouts. u128 fee arithmetic prevents overflow-to-zero.
- Liveness: seller escalation after deadline avoids buyer-only deadlock, but a missing arbitrator can still strand disputes. No unilateral timed withdrawal is promised.
- Governance: management can pause deposits and rotate arbitrators, including for existing escrows. Upgrade authority can alter program behavior. Non-custodial does not mean governance-free.
- Database: RLS and column grants prevent user-written verification/status/chain fields. It is not currently a source of product state. Future evidence, auth and mirror services need a separate security review.
- Local terms: localStorage is readable by same-origin scripts. Do not store secrets/private evidence; download backups. Imported text is rendered as text, never executed. A hash proves exact bytes, not consent or fulfillment.

## Residual risks / launch blockers

Independent contract audit and real network tests are mandatory. Legacy SDK dependency advisories remain; see SECURITY.md. Rent and accidentally transferred vault surplus have no recovery flow. This version has no hosted evidence, privacy deletion service, staffed arbitration SLA, account recovery or multisig web UI. Mainnet is disabled. Never present mock data or screenshots as chain proof.
