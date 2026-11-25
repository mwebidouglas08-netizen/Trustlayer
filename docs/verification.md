# Verification record — 2026-11-25

Environment: Node 22.22.3, npm 10.9.8, Linux. Results distinguish local tests, actual Supabase operations and unverified production paths.

## Live Supabase — executed, not simulated application data

- Inspected the owner-selected project before migration; public schema was empty.
- Applied five migrations and confirmed their recorded history. Deployed two active Edge Functions and a private bucket.
- Auth, database, REST and Storage reported `ACTIVE_HEALTHY` through the connected management API.
- Fetched the actual deployed health endpoint: `databaseReady: true`, `privateStorageReady: true`, `paymentsReady: false`.
- Executed `supabase/verification/workspace.sql` against the connected database: creator access, draft privacy, verified seller invitation and acceptance, outsider denial, forbidden profile/status changes, no client wallet completion, protected agreement edits and activity events all passed.
- Executed `supabase/verification/challenges.sql`: exact maximum-u64 text readback, restricted challenge access, no client audit insertion, service-only completion and replay rejection all passed.
- All SQL test fixtures, including test auth users and wallet rows, were rolled back. These are transactional regression tests, not fake user-visible transactions or claimed end-to-end wallet operations.
- Inspected the deployed row/storage policies. No public-read evidence bucket or direct client agreement mutation was enabled.

## Local checks

- Lint: zero warnings.
- TypeScript: frontend, contract test source and operator script checks passed. Typechecking the integration test is **not** executing the contract.
- Unit/policy tests: **16 passed**, covering amounts, fees, role/deadline permissions, network validation, RPC policy, file input limits, wallet-signature adapters and the actual Edge handler source.
- Edge handler unit tests use real Ed25519 keys/signatures with mocked Auth/database transports. Valid proof, invalid proof, expiry, replay, missing/invalid auth and cross-account proof access are covered. They do not claim a real user's browser login or deployed function invocation passed.
- Next.js production build passed.
- Browser regression suite: **16 desktop/mobile checks passed** against the local production server, including account gating and private agreement URL denial. Screenshots inspected; no horizontal overflow on tested workspace/account pages.
- Dependency lockfile updated; `git diff --check` passed.

## Existing CI failures and changes

The previous commit's GitHub workflow failed at Anchor CLI installation, external Playwright browser installation and local Supabase startup. It was not green. This change pins the Anchor CLI install toolchain to Rust 1.79 (upstream Anchor 0.30.1 locks time 0.3.29), uses the npm-bundled Chromium path already exercised here, and aligns local PostgreSQL to the selected project's major version. **These changes are not a claim that the next remote workflow passed.** Read its actual result before treating CI as cleared.

## Not completed / release blockers

- A real two-account browser flow against a promoted frontend: native wallet sign-in, authenticated deployed wallet-link function, and actual private object upload/download. These require operator-controlled wallets and acceptance testing on the deployed site.
- Promotion to the provided Vercel production URL. It still served the original scaffold when fetched. Vercel is not connected to this session; Git push and preview availability are not production promotion.
- Rust/SBF build and local-validator contract execution in this sandbox: required binaries and download hosts are unavailable.
- Program deployment, published matching IDL, initialized config, funding and real chain settlement. The owner explicitly confirmed these are not deployed/audited. No mainnet activation occurred.
- Independent audit, remaining SDK advisories, shared abuse/cost quotas, file malware scanning, retention/deletion procedures, backups, staffed arbitration/support and legal review.

## Dependency audit

`npm audit --omit=dev` reports **12 advisory entries: 5 high and 7 moderate**, in the Anchor/Solana dependency family. No new Supabase advisory entries were reported in this check. See `SECURITY.md`; a successful web build is not a clean security audit.

See `docs/supabase-deployment.md` for exact cloud inventory and authentication settings. A healthy database is not certification of a production financial service.
