# Architecture

Trustlayer now has two deliberately separate subsystems.

## 1. Account-backed collaboration (deployed Supabase)

`AccountProvider` maintains a Supabase session. `AccountPage` uses native `signInWithWeb3` with a Solana message signature, explicit statement, random nonce and expiry. Connection to an injected wallet is **not** account authentication. Authentication tokens remain in browser session storage managed by the SDK; the database and Edge Function enforce authorization server-side.

A separate signature-verification flow binds wallet ownership to an account:

1. Authenticated `issue_wallet_challenge` creates a five-minute, server-generated message bound to account, address, canonical origin and random challenge ID. Issuance is limited to ten per account per five minutes.
2. The wallet signs the exact message. The client sends only challenge ID and signature to `trustlayer-verify-wallet`.
3. The Edge Function verifies bearer auth using Supabase, loads only that user's challenge, verifies Ed25519, then calls a service-only atomic completion function.
4. A globally unique wallet identity, account-active checks, row/advisory locks and single-use consumption prevent conflicting claims or replay. Verification does not authorize payment or prove legal identity.

`agreements` are private drafts, then proposals, then accepted/cancelled records. Only restricted RPCs can mutate them. Proposal requires a verified creator wallet; acceptance requires the verified named counterparty and a future deadline. Terms cannot be edited after proposing. Agreement status is **never** a chain funding state. `amount_text` exposes exact integer units without numeric JSON precision loss.

`agreement_events` is a persistent, participant-readable activity record. Clients cannot write or edit it directly. This is platform-controlled audit data, not an externally immutable ledger.

`agreement_files` metadata and the private Storage bucket have separate participant/uploader policies. Insert paths bind agreement and uploader. The bucket bounds object size/MIME; downloads use 60-second signed links. No participant overwrite/delete is allowed. Files are not malware-scanned; signed URL holders can access the object until expiry. Retention/legal deletion, scanning, backup and cost controls remain operator responsibilities. An upload whose metadata write fails may leave a private orphan object and reports a recovery path rather than pretending success.

## 2. Solana escrow (not deployed)

The existing Anchor client reads confirmed state and builds wallet-signed instructions via a bounded same-origin RPC proxy. It validates genesis, program IDL, config owner/mint, and fetched escrow owner/PDA/version. It does not write a database payment mirror. The user confirmed that no reviewed program deployment exists; signing stays unavailable and mainnet is disabled.

Program state machine:

- Created → Funded: buyer, before deadline, not paused.
- Created → Cancelled: buyer or seller.
- Funded → DeliverySubmitted: seller claim, not delivery proof.
- Funded/DeliverySubmitted → Released: buyer.
- Funded/DeliverySubmitted → Disputed: buyer; seller after deadline.
- Disputed → Refunded/ResolvedToSeller: current arbitrator.

Bootstrap is upgrade-authority-only; management can pause new exposure and rotate authorities with two management signatures. Rotation affects existing disputes. Vault, mint and beneficiary constraints and wide fee arithmetic protect settlement, but are not a substitute for execution tests and independent audit.

On-chain agreement JSON is a separate local/downloaded artifact with an on-chain hash. Saved Supabase proposals do not automatically create or fund an escrow, and have no forged chain linkage. Connecting these lifecycles requires a reviewed deployed program and server-verified reconciliation.

## Trust and deployment boundaries

`apps/web/lib/supabase/deployment.ts` contains the selected public API URL and publishable key, not service credentials. RLS and RPC authorization—not hidden buttons—protect records. Supabase-managed service secrets exist only in Edge runtime. Public health checks distinguish backend readiness from payment readiness.

The canonical Vercel site still requires promotion of this branch. See `supabase-deployment.md` for deployed inventory and `verification.md` for the distinction between live, local and still-unverified checks.
