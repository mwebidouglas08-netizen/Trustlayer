# Trustlayer

A wallet-first Solana escrow Dapp with a responsive Next.js interface and an Anchor program. **Test networks only. Unaudited. Not a production financial service.**

## What works in this release

With a deployed, initialized program and published IDL:

- Phantom / Solflare connection, account-change handling, real wallet balances and participant-filtered escrow discovery.
- Create an agreement, download its terms, verify its SHA-256 hash, and share an escrow link.
- Fund escrow, submit a delivery claim, release payment, cancel unfunded agreements, open disputes, and execute authorized full-refund / seller-payment resolutions.
- Exact six-decimal token amounts, disclosed snapshotted fees, confirmation polling, explorer receipts, and explicit pending/error states.
- Operator pause/resume controls; two-signer authority rotation through an operator script.

No balances or successful transactions are simulated. With no program configured, the app remains browsable but signing is disabled.

## Quick start

Use **Node 22** and **npm 10**. One workspace, one package manager, one tracked lockfile.

```sh
npm ci
cp .env.example apps/web/.env.local
npm run dev                    # binds 0.0.0.0:3000
npm run check                  # lint, TypeScript, unit tests, production build
```

Open `/app` for the workspace. An actual wallet extension or the wallet's in-app browser is needed for signing. Web deployment variables are described in [deployment](docs/deployment.md). No Google font downloads are required to build.

## Program and database tests

There is one canonical Rust program at `programs/trustlayer_escrow/src/lib.rs` and one root Anchor workspace.

```sh
# Requires Rust, Solana 1.18.26, Anchor CLI 0.30.1
anchor build
anchor keys sync               # sync generated local deployment identity
anchor build
anchor test --skip-build       # fresh local validator, upgradeable deployment
cargo test -p trustlayer_escrow --lib

# Requires Docker + Supabase CLI; the wallet-first web app does not need Supabase
supabase start
supabase db reset
supabase test db
```

Never commit `target/`, wallet keys, generated program keypairs, or secrets. Deployment IDs must be updated intentionally before deploying a new instance.

Browser checks, with the web server already running:

```sh
npm run test:e2e                # Playwright desktop and mobile; install Chromium first
npm run test:e2e:sandbox        # bundled Linux Chromium for restricted environments
```

The tests cover financial input boundaries, action permissions, RPC request policy, disconnected and missing-wallet states, wallet rejection, mobile navigation, configuration gating, and malicious RPC requests. Anchor tests cover real local-validator settlement and authorization; SQL tests cover database grants and policies. Read [verification](docs/verification.md) for what was actually executed in the implementation environment.

## Explicit limitations

- No deployed program or operator keys are included. Mainnet signing is disabled in both browser and RPC route.
- No hosted private evidence, email invitations, Supabase account login, staff case queue, appeals, or staffed arbitration service. Wallet authorization is used for the current product; database auth is not pretended.
- Agreement terms are local/downloaded, not backed up by a server. On-chain creation does not certify seller consent. Obtain agreement out-of-band before funding.
- Deadlines enable seller escalation, not automatic release/refund. Arbitrator availability and key security remain trust dependencies.
- Settled/cancelled accounts are not closed; rent and accidental excess vault deposits have no recovery instruction in this release.
- Dependency advisories in the legacy Anchor/Solana toolchain remain release risks; see [security](SECURITY.md).

## Documentation

- [Architecture & implemented behavior](docs/architecture.md)
- [Deployment and initialization](docs/deployment.md)
- [User guide](docs/user-guide.md)
- [Threat model](docs/threat-model.md)
- [Incident response](docs/incident-response.md)
- [Production launch gates](docs/production-checklist.md)

There is no external handoff document required to understand this repository. Do not enable real-value usage without completing the launch gates and an independent audit.
