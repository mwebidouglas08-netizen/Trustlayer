# Audit continuation — actual evidence and merge gates

This report supersedes older statements that no Devnet deployment has been reported. The owner supplied a deployed identity; independent live verification remains incomplete here. This is not a financial production-readiness certification.

## Source provenance

The published audit commit `18e5802083042de457202df9571773799a6f9897` was fast-forwarded onto Arena's existing working branch. It includes the deployed program identity, seven migrations and transaction synchronization. The uncommitted WSL files were not accessible. Described fixes were independently implemented where reproducible; this does not claim to preserve unseen WSL edits. No program, authority, migration or live Edge Function was redeployed by this continuation.

## Changes and reasons

- `Anchor.toml`: 60-second isolated-validator startup allowance; program identity unchanged.
- Contract tests: derive deadlines and expiration from Solana Clock sysvar. Wall time only bounds polling; failure to advance the chain clock fails the test. Runtime execution remains required.
- `BackendStatus`: remove nondeterministic render-time date fallback; show unverified until there is evidence.
- `AppShell` / CSS: close mobile navigation for every sidebar link, including lower links; preserve scrolling reachability. This addresses a concrete overlay path, not a claim that every reported unresponsive button was reproduced.
- `rpc-policy`: permit getSlot; retain faucet/unknown-method rejection.
- New RPC-handler unit regression: malformed JSON, oversized bodies, unsupported methods and foreign origins must not call upstream fetch.
- Playwright: pin 1.65.1 consistently in manifest/lockfile. Own an isolated production server on port 3100 by default instead of assuming a manually started server. Explicit TEST_BASE_URL continues to support deliberate remote testing. Build first. RequestAirdrop rejection now has a 5-second timeout rather than hiding hangs with longer waits.
- CI: use Playwright's matching Chromium, not the older npm-packaged Chromium. The legacy sandbox helper remains optional and forwards CLI arguments; it was not used to certify this suite.
- Transaction synchronization queue: re-read the persisted queue after awaiting server acknowledgement, avoiding deletion of entries enqueued while that request was running. New actual-source unit regression covers this race within a tab. Cross-tab atomic storage and account-scoped queues remain follow-up work.
- Escrow client: check executable upgradeable program account and all required instruction names before enabling operations. This does not prove a full IDL/binary audit.
- `scripts/verify-devnet.mjs`: read-only verification of genesis, program/ProgramData, upgrade authority, Config PDA/owner, mint/decimals, treasury, arbitrator, 1% fee, pause state, and complete local/on-chain IDL equality. Takes optional IDL path; requires network access and the operator's generated public IDL. Reads no signing key. Throws rather than claiming readiness on missing data.
- `.env.example`: actual variable names and owner-supplied public Devnet identifiers. Changing this example does not configure Vercel.
- Other modified frontend files have formatting-only normalization of the imported audit code.

## Test evidence from this continuation

- Clean `npm ci`: passed.
- `npm run check`: passed lint, frontend TypeScript, **20/20 unit tests**, production build and 31 static pages.
- `npm run test:contract:types`: passed; this is not contract execution.
- `npm run format:check`: passed.
- `npm run test:e2e -- --grep 'RPC rejects'`: **2/2 passed**, desktop/mobile projects, HTTP requests against a freshly started production server; approximately 50 ms each. These tests require no browser launch.
- `npm run test:e2e -- --max-failures=1`: stopped at the first browser-launch failure, **1 failed / 17 not run**. The matching Chromium executable is missing. This is an environment failure, not 18 reproduced application bugs.
- `npx playwright install chromium`: failed with ECONNRESET to cdn.playwright.dev, outside the sandbox network allowlist. No older browser was substituted.
- Devnet RPC request failed at TLS connection; read-only deployment verifier exits nonzero without asserting readiness.
- Anchor/Rust/Solana/Docker are absent from this sandbox. No new contract build, local-validator execution, pgTAP or funded Devnet lifecycle result is claimed.

## Live Supabase evidence

Read-only connector checks verified:

- Auth, Database, REST and Storage ACTIVE_HEALTHY.
- Seven migration versions match the published audit repository.
- trustlayer-health, trustlayer-verify-wallet and trustlayer-sync-transaction ACTIVE.
- transactions, transaction_events, wallets and wallet_challenges have RLS enabled, no anonymous SELECT grants and no authenticated INSERT/UPDATE grants.
- complete_wallet_challenge and trustlayer_apply_event_mirror are SECURITY DEFINER with empty search paths and no anonymous/authenticated execute grants.
- issue_wallet_challenge is SECURITY DEFINER with empty search path, available to authenticated users but not anonymous callers.

These are metadata/grant checks, not a new authenticated sign-in, participant-authorization matrix or live transaction-sync acceptance run. Deployed function source equality was not established.

## Remaining security/integration review

The sync source uses **confirmed**, not finalized, transactions and account reads. It mirrors current account state while ordering writes by the submitted transaction's position, rather than the observed account context slot. Finality/reorg reconciliation and concurrent/out-of-order state-snapshot correctness need dedicated tests before durable settlement claims. Event insertion and mirror update are separate operations with retry recovery, not a single atomic transaction. No claim of exhaustive idempotency validation is made.

Wallet authentication, real Phantom/Solflare signing, session restoration and private upload/download still need deployed acceptance checks. Off-chain agreements and on-chain escrow remain separate lifecycles, not an automatically verified unified bridge. No funds were moved, minted or settled in this continuation.

Dependency audit: **18 total advisory entries (2 low, 10 moderate, 6 high)**; production-only **12 (7 moderate, 5 high)**. Anchor/toml and bigint-buffer/Solana dependency findings remain. Suggested fixes include incompatible major upgrades or SPL Token downgrades; no forced upgrade was applied. Pure-JS bigint fallback is a build warning, not resolution of advisories.

## Deployment and Git gates

The published audit branch's most recent inspected CI run, 45981619647, had web success but contract build/test and Supabase startup failures. Do not merge merely because frontend tests pass. New CI must be checked independently.

The supplied production URL responds with the redesigned Trustlayer landing page. This proves page availability, not the configured program, wallet operation, build commit, or payment readiness. Vercel connector is disconnected, so production env/build/promotion could not be inspected. Deployment protection was not changed.

The continuation is intended for a draft PR from the Arena session branch into main. It must remain unmerged until critical CI, real-browser and contract checks pass. No claim that origin/main contains this continuation should be made before an actual merge.

## Next execution on a capable runner

1. Build; install matching Playwright Chromium and required OS libraries; run complete browser suite.
2. Run contract build/test against a fresh isolated upgradeable validator using a compatible toolchain, preserving deployed identity. Resolve CI startup/build failures using their full logs.
3. Run `node scripts/verify-devnet.mjs /path/to/trustlayer_escrow.json` on a network-enabled machine. Do not share keys; the IDL is public.
4. Complete authenticated Supabase sync tests, including duplicates, concurrent/out-of-order events, wrong user, invalid signature, failed/unconfirmed transactions and finality handling.
5. Complete test-USDC Devnet lifecycle with operator-controlled buyer/seller/arbitrator wallets. Save public signatures and actual balance deltas.
6. Review the complete diff and advisory risks; merge only after critical gates pass, then verify Vercel production build and runtime configuration.

## CI error-log follow-up

The supplied contract log confirms host Cargo 1.79 cannot parse the Edition 2024 manifest for locked `getrandom 0.4.3` (via `ahash 0.8.14`). CI now uses current stable Rust for project metadata/host builds and explicitly uses `cargo +1.79.0` only to install Anchor CLI 0.30.1. This addresses the demonstrated host-metadata incompatibility; it does not establish SBF compatibility. Solana 1.18.26's separate platform toolchain may still require a tested compatible dependency graph. No Cargo.lock versions were guessed or hand-edited.

CI also creates its disposable wallet at the path configured by Anchor.toml, rather than the unrelated default id.json. Metadata, initial SBF build, ephemeral local identity synchronization, local-validator execution, and host Rust tests are separate steps so the next failure is identifiable. Tool versions are logged; lockfile drift fails validation. No generated identities are committed or deployed remotely.

The supplied database excerpt contains only Docker image-pull progress, not the terminal error. Its cause is still unknown. Startup output is now captured with pipefail preserved, a short tail and container/disk status are printed on failure, and failed startup output is retained as a seven-day CI artifact. This is for the disposable local CI stack; no hosted project credentials are injected. Database service health checks/tests were not bypassed.

Validation of these workflow edits: YAML parsing, targeted toolchain/failure-propagation assertions, Prettier and git diff checks passed. Actual contract/database execution still requires the new CI result. This follow-up is not a claim of passing runtime tests or production readiness.
