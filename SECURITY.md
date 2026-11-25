# Security status

**Unaudited; test networks only. Do not deposit real-value assets.** No program deployment, private keys or security certification is bundled with this repository.

Report suspected issues privately to the repository owner before publishing exploit details. Do not put secrets, personal evidence or private keys in public issues. There is not yet a staffed security contact or response SLA; publishing one is a production launch gate.

## Dependency status

Next.js was updated from 14.2.18 to 15.5.29. PostCSS is overridden to a patched 8.5.33. Unused dependencies were removed and npm dependency resolution is locked. Run `npm audit` regularly; a successful build is not a vulnerability clearance.

The Anchor 0.30.1 / Solana web3 v1 / SPL Token dependency family still reports advisories, including `toml`, `bigint-buffer`, `uuid`, and `stream-json`. The browser bundle uses browser entry points/pure JS rather than native bigint bindings, and this app does not parse user TOML or expose the JSON streaming server API. That reduces specific exposure but does **not** mean these advisories are resolved. Blind major-version overrides can break the wallet/IDL ABI; a tested SDK/toolchain migration or explicit reviewed mitigation is required before production. Dependency audit results are uploaded by CI rather than silently ignored or represented as clean.

## Program properties

- Upgrade-authority-only configuration bootstrap.
- Explicit vault, mint, token-authority and beneficiary constraints.
- Buyer release / arbitrator resolution signatures and terminal-state checks.
- Capped fees with wide arithmetic.
- Pause only blocks new exposure; exits remain possible.
- Two-signer management rotation; current arbitrator governance applies to existing escrows.

Residual fund-lock, governance, RPC, agreement storage and operational risks are documented in `docs/threat-model.md` and `docs/production-checklist.md`.
