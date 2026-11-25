# Launch gates — not a production certification

- [ ] Build the canonical Anchor program with a recorded toolchain and Cargo lockfile.
- [ ] Pass local-validator adversarial integration tests, Rust unit tests, and SQL tests.
- [ ] Complete independent contract and application audits; resolve all findings.
- [ ] Resolve or formally accept remaining dependency advisories and test migrations.
- [ ] Deploy the reviewed program, publish the matching IDL, securely initialize config, and verify mint/network.
- [ ] Run and record two-wallet devnet lifecycle and both arbitration outcomes, including timeout/pause/rotation cases.
- [ ] Use secured governance / multisig procedures, upgrade controls, key backups and rotation drills.
- [ ] Provide an actual staffed arbitration/evidence channel, response SLA, escalation policy and legal-reviewed disclosures before offering protection to users.
- [ ] Define account-rent, accidental vault deposits, permanently unavailable arbitrator and disaster-recovery policies.
- [ ] Configure production RPC quotas, shared rate limiting, independent chain reconciliation and service alerts.
- [ ] If introducing backend auth/evidence: add server session/role checks, wallet challenges, participant RLS tests, private storage policies and retention/deletion processes.
- [ ] Reconcile public copy with deployed functionality; never advertise planned security guarantees as implemented.
- [ ] Review accessibility, browser wallet compatibility, slow/rejected signatures and mobile signing end-to-end.
- [ ] Legal approval and explicit audit-backed decision before a separately reviewed mainnet-enablement change.

Passing web tests alone does not satisfy these gates. This repository remains test-network-only.
