# Architecture

## Current product

The app is a wallet-first client of a single configured Anchor escrow program. Next.js serves the UI and a same-origin, fixed-upstream JSON-RPC proxy. The proxy forwards already-signed transactions; it has no signing keys and cannot authorize fund movement. State and balances come from confirmed Solana accounts, not browser-local records or a database mirror. The client checks RPC genesis, deployed program IDL, configured mint and token decimals before enabling actions.

The wallet adapter supports injected Phantom and Solflare providers. Each operation is constructed locally, signed by the wallet, submitted with preflight enabled, and polled for confirmation. A timeout is explicitly not reported as a definite failure. Account changes invalidate cached reads. Disconnected and unavailable states display no fabricated numbers.

## Escrow state machine

- Created → Funded (buyer, before deadline, not paused)
- Created → Cancelled (buyer or seller)
- Funded → DeliverySubmitted (seller; a claim, not delivery proof)
- Funded / DeliverySubmitted → Released (buyer)
- Funded / DeliverySubmitted → Disputed (buyer any time; seller after deadline)
- Disputed → Refunded / ResolvedToSeller (current configured arbitrator)
- Terminal states cannot pay again.

The singleton configuration is initialized only by the upgrade authority of this program. Mint must be an actual six-decimal SPL Token mint; operators must independently verify its identity. Management can pause new escrows and deposits, not exits. Authority rotation requires the current and proposed management signers; rotation also sets the current arbitrator and affects **existing disputes**. Fees and fee recipients are snapshotted per escrow, capped at 100 bps, and calculated with u128 intermediates.

Vault identity, vault authority, mint and beneficiary ownership are enforced by the program. The UI creates associated destination accounts idempotently when needed. Funding uses the buyer's associated token account; the total displayed balance can include other token accounts.

## Agreement data

Canonical UTF-8 JSON contains version, seller address, integer base-unit amount, Unix deadline, and trimmed terms. SHA-256 of those exact bytes is recorded on-chain. Downloads/imports retain exact bytes. Browser storage is best-effort convenience, never authoritative. Public on-chain records include wallet identities, amounts and agreement hashes; avoid personal data in terms. Seller consent and evidence exchange occur out-of-band in this release.

## Supabase boundary

The schema is retained and hardened for future backend services. It is **not currently used** by the web transaction flow. User-facing grants permit own-profile edits on an allowlist of columns and participant transaction reads, not privileged status edits, wallet self-verification or transaction state writes. Audit logs are service-only. No arbitrary user input is mirrored as chain truth.

Before adding a DB mirror, implement server verification of owner/PDA, program, network, mint, participants, amounts and finality; idempotent signature/event handling; reconciliation; authenticated roles; single-use wallet verification challenges; and private storage policies. Do not repurpose the wallet connection as a Supabase login or assume public route visibility grants server permissions.
