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

## Confirmed database startup cause: leading UTF-8 BOM

The complete supplied CI log shows all image downloads completed and PostgreSQL then rejected statement 0 of `20261125084842_trustlayer_initial.sql` with SQLSTATE 42601. Byte inspection confirmed a leading EF BB BF (UTF-8 BOM). The fix removes exactly those three bytes; all SQL statements and migration versions are unchanged. No hosted migration was rerun or reset.

A dependency-free SQL encoding guard now runs before database container startup and in `npm run check`. It rejects BOMs, invalid UTF-8 and NUL bytes. Three guard tests pass; all 11 repository SQL files pass. A regression check against the Git version of the original migration fails as expected, and byte comparison verifies the fix changes nothing beyond the BOM. Docker/pgTAP execution is still unavailable locally; the next CI result must confirm startup and the subsequent migrations/tests. Download-progress output was not the cause of this demonstrated failure.

## IDL compiler compatibility follow-up

CI run 46022084054 confirms web (including browser regressions) and database (including migrations and authorization regressions) passed on 920b84e. The contract job failed during `anchor build`; the supplied final log explicitly reports `Building IDL failed`, with E0425/E0599 in proc-macro2 1.0.94 referencing removed `proc_macro::SourceFile` / `Span::source_file` APIs. This is not evidence of a failed Git push or deployed transaction.

Updated only proc-macro2's Cargo.lock entry to 1.0.107. The crates.io index obtained through its GitHub mirror verifies the release is not yanked, its checksum, unchanged normal dependencies (unicode-ident), and Rust minimum 1.71. The upstream 1.0.107 wrapper no longer references those removed APIs and instead uses probed file/local_file support. No program source, ID, authority, schema, or security test was changed. The lock entry was updated directly because Cargo is unavailable in Arena; CI's existing `cargo metadata --locked`, IDL build, validator tests, host tests and lock-drift gate must validate the complete dependency graph and execution. This is a targeted fix for the supplied compiler errors, not a claim that all subsequent contract checks pass.

## Anchor IDL span API follow-up

The next supplied log shows proc-macro2 compiles, but Anchor 0.30.1's anchor-syn IDL generator itself calls the removed `Span::source_file()` API. Vendored upstream `lang/syn` from Anchor tag v0.30.1 with its Apache-2.0 license and a single source substitution: use `Span::local_file().expect(...)` to obtain the actual filesystem path. Missing path information still fails closed; IDL generation, alias resolution and all security tests remain enabled. A root `[patch.crates-io]` selects this local crate and its Cargo.lock entry is changed from registry to path provenance. No other dependency version or program source changes in this follow-up.

Validation: compared every vendored upstream file against the downloaded tagged archive; only `src/idl/defined.rs` differs functionally; an upstream trailing space in a comment in `src/codegen/accounts/try_accounts.rs` was also removed for the whitespace gate. Cargo TOML/lock parsing and patch-path checks passed. Rust/Anchor remain unavailable locally; locked dependency metadata, full IDL build and isolated lifecycle tests must be confirmed by CI before merging. The prior proc-macro2-only change was insufficient by itself; this patch addresses the newly demonstrated Anchor-side incompatibility.

## Local-validator program identity mismatch

The supplied validator output reports all seven tests failing with `DeclaredProgramIdMismatch` (4100). Inspection of upstream Anchor v0.30.1 `keys_sync` shows it updates the Rust declaration but breaks out of the cluster loop after the first changed program entry. With both Devnet and Localnet configured, this can leave Localnet using the deployed address while the binary declares the runner's disposable address.

CI now generates the disposable program keypair first, explicitly updates only the runner's Rust declaration and Localnet configuration, and builds once after those edits. It no longer relies on multi-cluster `anchor keys sync`. A pre-test guard checks that the public key, source declaration, Localnet entry and generated IDL agree. The helper refuses execution outside GitHub Actions. Committed program source and Anchor.toml, including the deployed Devnet identity, remain unchanged. No private key is printed or uploaded.

Two regression tests pass, including both cluster section orders, Devnet preservation, idempotence, and rejection of missing/ambiguous inputs. Workflow YAML parsing and diff whitespace checks pass. Existing validator security assertions remain unchanged. Actual validator execution still requires the next CI run; the seven failures shared an identity setup error and are not evidence that seven independent escrow logic fixes were needed.

## Read-only verifier diagnostics and raw IDL decoding

The WSL verifier now resolves dependencies, but its previous generic error did not establish which check failed. Inspection found a separate verifier defect: raw Anchor IDLs contain `Config` and snake_case fields, while the direct Borsh decoder was called with `config` and its result read with camelCase names. Decode through Anchor Program's normalized coder instead, without signing or RPC writes. A synthetic regression reproduces the old name failure, verifies normalized fields, and confirms corrupt discriminators remain rejected. This does not establish that decoding caused the observed WSL failure; another stage may have failed first.

Added fixed-label stage diagnostics and a sanitized failure category; exception messages/stacks and RPC URLs are not printed. The raw published/local IDL equality check remains intact. Verifier and Localnet identity regression tests now run in web CI. Live verification still requires rerunning the script from the current audit branch in WSL.

## Sign-in investigation and client hardening

Hosted read-only inspection confirms Solana Web3 auth enabled, signups allowed, the supplied production site URL configured, and the auth.users profile trigger present with an empty search_path. No hosted auth settings or database permissions were changed. These observations do not establish the precise cause of the user's live failure without the failing response.

Fixed a reproducible cross-realm signature compatibility defect: instanceof Uint8Array rejected valid extension-origin bytes. The normalizer now validates byte-view type/length and normalizes foreign-realm Uint8Arrays while rejecting malformed signatures. Added sign-in account-change guards, explicit current-origin /app/profile signing URL (excluding query/hash), session-required success handling, backend auth error codes, and connection-error visibility on the account page. No anonymous login fallback, fake session, signature bypass, or RLS relaxation.

Validation: npm run check passed lint, TypeScript, 23 unit tests and production build. New tests cover cross-realm bytes, wrong typed arrays, wallet method receiver, auth URL, missing session and account switching during signature. Actual Phantom/Solflare interaction, production auth requests, authenticated agreement creation and responsive browser acceptance remain unverified for this change. Existing responsive layout has not been replaced. Need the exact live auth error and production deployment verification before claiming resolution of the reported incident.

## Mobile wallet-browser handoff

Ordinary mobile browsers cannot enumerate installed wallets or use providers injected only inside wallet apps. Connect now offers a shared native dialog on HTTPS mobile browsers when no requested injected wallet is available, with Phantom and Solflare HTTPS universal browse links. These open the current path inside the selected wallet browser. The user then connects and signs there; this is not an encrypted native-connect callback returning a session to Safari/Chrome, and installed-app detection is not claimed. Already injected providers retain the existing connection path.

Auth queries/fragments are stripped from outbound links. The responsive native modal supports Escape, focus restoration, scrolling and 48px touch targets. No wallet secrets are requested, no connection is fabricated, and no auto-signing occurs. All existing connect entry points use the same provider fallback. npm run check passed lint, typecheck, 25 unit tests and production build. Actual iOS/Android wallet launch, connection and signing remain device acceptance tests; an OS may show the official wallet site if its app is absent or universal linking is disabled. Main promotion requires passing CI and a merge of the follow-up PR.

## Reported production RPC cluster mismatch

The reported message originates only after the browser receives a genesis hash from its same-origin /api/rpc proxy and compares it to the build-time cluster. The server selects SOLANA_RPC_URL independently. A wallet network toggle cannot repair that server/build configuration mismatch. Vercel connector lookup reports disconnected; production environment values and an actual response have not been inspected, so no specific upstream network or production fix is claimed.

Improved the failure message to identify the expected and recognized observed network and explain the required environment alignment/rebuild. Signing remains disabled for every mismatch, including unknown hashes. TypeScript and 26 unit tests passed, including Devnet success and Mainnet/Testnet/unknown mismatch cases. Needed operator action: inspect the production-scoped RPC setting and build-time cluster, align to the already verified Devnet program, redeploy, then verify the production /api/rpc genesis and real transaction lifecycle. Do not put credential-bearing RPC endpoints in chat or browser configuration.

## Confirmed SIWS formatting defect

The reported wallet message, "signature request cannot be shown due to invalid formatting", concerns off-chain sign-in, not an escrow instruction. A regression exercises the installed Supabase SDK's wallet fallback and confirms it serializes Version before URI and Nonce after timestamps, unlike the Solana Wallet Standard's canonical serialization. The earlier wrapper still delegated formatting to this SDK and therefore did not resolve this defect.

Pinned @solana/wallet-standard-util 1.1.2 to construct canonical sign-in text, signed through the selected wallet, then submitted through Supabase's explicit message/signature API. The server still verifies signatures and authentication policy. Preserve the current origin, account, cryptographic nonce, five-minute expiry and account-switch guards; no transaction or key access is introduced.

Validation: npm run check passed lint/typecheck/unit tests/build before the final SDK reproduction test; subsequent typecheck and all 28 unit tests passed. Tests include canonical field parsing, exact signed-byte equality, genuine Ed25519 verification, tamper rejection, server rejection propagation and reproduction of the SDK ordering defect. Hosted authentication and real wallet UI acceptance remain unverified, and production requires deploying this commit after CI. No WSL contract commands or program redeployment are required for this formatting fix. Dependency install reports 13 advisories (1 low, 7 moderate, 5 high); no force upgrades performed.

## Installation, identity icon and wallet navigation

Added a green shield/T SVG favicon, 180px Apple icon, 192/512px PNG install icons, same-origin standalone manifest, theme metadata and install UI. The service worker is deliberately network-only: no cached private pages, auth, RPC or balances and no fabricated offline success. Browser support determines install prompt availability; Safari gets explicit Add to Home Screen guidance. Native device installation has not been tested here.

Successful connection outside an existing /app/ subroute now routes into /app in the SAME browser, preserving the connected provider. This does not implement native wallet encrypted callbacks into the original browser/PWA; those require a separate protocol with state validation and session binding, and must not be implied by ordinary navigation. Wallet-browser and Safari sessions remain separate.

Reviewed EscrowClient.send: it requests an actual wallet transaction signature, calls sendRawTransaction with preflight enabled, polls actual signature status, rejects on-chain errors, and returns only on confirmed/finalized status. Transport failures retain the signature and warn against blind resubmission. This code inspection does not prove production execution. Earlier user-supplied WSL verifier output confirmed Devnet deployment/configuration/IDL; production RPC mismatch remains unverified. Need a production-proxy genesis result and real Devnet transaction receipt before declaring payment readiness.

Validation: npm run check passed lint/typecheck/28 tests/build; after install regression additions, typecheck and 30 tests passed. PNG dimensions/manifest paths and no-cache worker are tested. No program deployments, funds movements, auth changes or database writes performed.

## Download/export reliability and private evidence

Inspected all existing download call sites. Generated JSON exports used detached anchors with one-second URL revocation; private evidence used a detached cross-origin link following an awaited signed-URL request. These are compatibility risks, not proof of the exact user's device failure (no error/browser supplied).

Consolidated downloads into an attached-anchor helper with delayed URL cleanup and sanitized filenames (path separators, control characters, bidi overrides). Shared export controls provide native file sharing where supported, clear cancellation/errors, and accurately say "requested" rather than claiming a file was saved. Escrow JSON is exported byte-for-byte, without pretty-printing or a BOM, preserving its on-chain hash. Workspace record JSON stays human-readable and remains distinct from canonical escrow terms.

Private evidence now uses authenticated Supabase storage download, not navigation to a bearer signed URL. A prepare step fetches under existing storage RLS, validates size against metadata, then a fresh user gesture saves/shares the blob. Session/file changes invalidate pending results; no persistent browser cache or public bucket is introduced. Device sharing is deliberate user-directed data export. Existing private JSON export still contains the user's authorized record; no claims of encryption after saving to disk.

Validation: npm run check passed lint, typecheck, 33 tests and production build. Regression tests cover filename sanitization, exact UTF-8/hash preservation, attached link lifecycle and delayed revocation. Physical iOS/Android wallet-browser behavior and an actual authenticated evidence download remain unverified. No security certification, production rollout or resolution of every possible device restriction is claimed. Need CI and device acceptance before production readiness.

## Payment and mirror failure reporting

Reviewed the real signing/sendRawTransaction/status-polling path and the transaction sync client. Found that unsuccessful mirror responses logged a warning and resolved normally, preventing the calling UI from recognizing a pending backend update. Sync now rejects on non-acknowledgement or a missing session with queued receipts, retaining the receipt for retry. Focus/online retries handle rejection explicitly and warn against repeating payments. No signature, RLS, authentication or on-chain validation was disabled. A regression confirms a rejected mirror never resolves as success and retains its receipt across retries.

Hosted function metadata reports sync ACTIVE v3 and wallet verification ACTIVE v7; metadata is not execution evidence and hosted source was not compared in this phase. Repository sync checks require authenticated, verified wallet ownership for non-arbitration mirroring. Workspace draft creation remains off-chain; escrow creation and funding are distinct wallet-approved instructions. Silently sending transactions when saving a draft would misrepresent consent and is not implemented.

npm run check passed lint, TypeScript, 34 unit tests and production build. User previously supplied a successful production proxy Devnet genesis response and WSL deployment/IDL verification. Still missing: the actual failing payment signature or exact error, a successful funded production-origin Devnet lifecycle, and a backend mirror acknowledgement for that signature. No new deployment, program upgrade, database mutation or payment was performed. This fixes reporting and retry semantics, not a proven root cause of the user's unspecified payment failure.

## Confirmed funding failure: expired on-chain deadline

User supplied preflight logs for signature 36i7rLyqrQuXzDfWkhVwAUiM3EnZD8THQhGpdSxgZbipRkZ9vYK7ZPfMg9rrkpPccv2NXFDi7DvgefePjeLoDiE: FundEscrow reports InvalidDeadline, 6005 / 0x1775 at lib.rs:84. The source requires Clock.unix_timestamp < escrow.deadline_unix before token transfer. Therefore the attempted funding reached/exceeded the immutable escrow deadline according to chain time. The provided simulation logs are not proof of a committed payment; exact escrow account/deadline still requires its public address. Why the chosen deadline had elapsed (waiting, device skew or input choice) is not established.

Frontend now reads Solana Clock rather than using device time for client creation validation and detail action eligibility. Funding re-fetches the actual escrow and checks its Created state and deadline before wallet signing and again after approval, immediately before submission. The program's expiry restriction is unchanged and remains the ultimate authority; a deadline can still expire between the last RPC read and execution. InvalidDeadline preflight failures now explain that the RPC rejected this submission rather than claiming an ambiguous broadcast. Genuine transport/confirmation uncertainty retains its signature warning.

Existing expired/unfunded escrows cannot be funded by this patch. Participants must cancel and agree new terms/future deadline in a new escrow; no contract upgrade, reset, auto-extension or unauthorized funding is performed. Creation text now explains that the delivery deadline is also the funding cutoff.

Validation: npm run check passed lint/typecheck/36 tests/build; with additional mocked RPC boundary regressions, typecheck and all 38 unit tests passed. Tests verify Clock layout, exact strict deadline boundary, expiry during wallet approval blocks submission, and preflight error classification. These tests are not a funded Devnet lifecycle. Production acceptance requires the new frontend deployment and a genuinely funded future-deadline escrow receipt; previous expiry-rejection contract test remains enabled.
