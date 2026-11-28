# Trustlayer

**Agree on the work. Fund the escrow. Settle on Solana.**

Trustlayer is a buyer–seller workspace for private agreements and wallet-approved escrow payments. Buyers write a proposal, sellers accept its terms, and the buyer creates and funds an escrow on Solana Devnet. Documents and account activity stay in Supabase; token custody and settlement rules live in the Solana program.

[Open the app](https://web-xi-nine-d4ej5g61wk.vercel.app/) · [View the Devnet program](https://explorer.solana.com/address/7v6PxWejvNneG5TwZSntgj5ZjV6sgLSengjkVsct6V2G?cluster=devnet) · [Security](SECURITY.md) · [Verification notes](docs/audit-continuation.md)

> **Devnet testing only.** Use test SOL and the configured test token, not real funds. The web application is hosted publicly, but this is not a mainnet-ready or independently audited financial service. A successful build is not evidence of a successful payment; verify the transaction receipt and backend synchronization separately.

## Contents

- [Using the app](#using-the-app)
- [How the system works](#how-the-system-works)
- [Technology stack](#technology-stack)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [Codebase map](#codebase-map)
- [Tests and verification](#tests-and-verification)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Security and current limits](#security-and-current-limits)
- [Contributing](#contributing)

## Using the app

### Buyer and seller walkthrough

Use two separate test wallets and accounts to exercise both sides of a trade.

1. **Connect and sign in.** Open **Profile**, connect Phantom or Solflare, then select **Sign in with Solana**. Connection alone does not create an account session. A sign-in signature is a message, not a payment.
2. **Verify wallet ownership.** Complete wallet verification in Profile. This links the wallet to your account for private invitations and transaction synchronization.
3. **Write a proposal.** In **Agreements**, create a draft with the seller's wallet, amount, deadline and terms. Attach supporting documents if needed. Sending the proposal locks its terms.
4. **Accept as the seller.** Sign in with the seller's account and verified wallet, open the invitation and accept the proposal.
5. **Create escrow as the buyer.** Return to the accepted agreement, refresh its status and choose **Continue to escrow funding**. The app opens matching existing escrows or carries the accepted terms into a read-only creation form. Review and save the canonical agreement JSON before approving creation.
6. **Fund separately.** Open the created escrow and approve the USDC deposit. Creation uses SOL for network fees and account rent; it does **not** deposit USDC. Funding requires sufficient SOL and the exact configured test-token mint.
7. **Complete or dispute.** The seller can mark delivery submitted. The buyer can release payment or open a dispute. Dispute resolution is restricted to the configured arbitrator; it is not an automatic refund process.
8. **Check the receipt.** Follow the Solana Explorer link and confirm the on-chain result. Supabase history synchronization is a separate acknowledgement. If sync is pending, retry sync—not the payment.

**The deadline is also the funding cutoff.** Funding must finish before the deadline according to Solana's Clock, including time spent approving the wallet prompt. An expired, unfunded escrow must be cancelled and replaced with newly agreed terms; its deadline is not silently extended.

### Where to find things

| Feature              | App route                    | What it is for                                            |
| -------------------- | ---------------------------- | --------------------------------------------------------- |
| Workspace            | `/app`                       | Overview and entry points                                 |
| Account and identity | `/app/profile`               | Sign-in, wallet verification and profile                  |
| Agreements           | `/app/agreements`            | Private drafts, proposals, accepted terms and attachments |
| Invitations          | `/app/invitations`           | Proposals addressed to your verified wallet               |
| Transactions         | `/app/transactions`          | On-chain escrows and available actions                    |
| New transaction      | `/app/transactions/new`      | Standalone escrow creation                                |
| Disputes             | `/app/disputes`              | Escrows awaiting resolution                               |
| Wallet               | `/app/wallet`                | Connected-wallet information                              |
| Settings and help    | `/app/settings`, `/app/help` | Preferences and usage guidance                            |
| Status               | `/status`                    | Service status and verification context                   |

On a phone, the wallet chooser can open the site inside Phantom or Solflare's browser. Continue connecting and signing there: the session does not transfer automatically to a separate Safari, Chrome or installed-app window. Supported browsers offer installation; on iPhone, use **Share → Add to Home Screen**.

Exports support **Download** and **Share / Save** where available. For private attachments, choose **Prepare download**, then save the file. Keep a durable copy of escrow terms: the blockchain stores their hash, not the full private text.

## How the system works

Trustlayer uses a hybrid on-chain/off-chain architecture, organized as an npm-workspace monorepo.

```text
Browser / wallet
  ├── Next.js workspace ── Supabase Auth, PostgreSQL and private Storage
  ├── Wallet-approved transaction ── Next.js RPC proxy ── Solana Devnet
  └── Confirmed signature ── authenticated Edge Function ── verified history mirror
```

### Two related workflows, two sources of truth

**Workspace proposals** move through draft, proposed and accepted/cancelled states in PostgreSQL. Row-level security controls who can read or change records. Acceptance records consent; it is not a blockchain deposit.

**Escrow accounts** follow the program's state machine:

```text
Created ──fund──> Funded ──submit delivery──> DeliverySubmitted
   │                 │                              │
   └──cancel         ├──release to seller────────────┤
                     └──open dispute────────────────┘
                              │
                     Arbitrator resolution
                       ├──pay seller
                       └──refund buyer
```

Available transitions depend on role, state, pause configuration and deadline. The Rust program—not the UI or a database status field—enforces them. Buyer release and dispute actions can also be available before delivery submission; see the program for the full rules.

The accepted-proposal handoff matches escrows by connected buyer, seller and the hash of canonical terms. It is not a contract-enforced unique association between a workspace proposal ID and an escrow address.

### Responsibilities

- **Next.js:** forms, wallet interaction, message signing, transaction construction, status display and same-origin RPC proxying.
- **Solana program:** escrow identity, vault custody, funding, payout destinations, fee limits, cancellation and dispute authority checks.
- **Supabase:** user sessions, verified wallet ownership, private proposals/files and a verified transaction-history mirror.
- **Sync Edge Function:** checks the submitted receipt against the chain before updating backend history. It cannot create a payment by inserting a database row.

## Technology stack

| Layer                    | Tools                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Web application          | Next.js 15, React 18, TypeScript, Tailwind CSS and custom CSS                                      |
| Wallet and Solana client | Phantom/Solflare browser providers, `@solana/web3.js`, SPL Token, Solana Wallet Standard utilities |
| Smart contract           | Rust, Anchor 0.30.1, Solana 1.18.26 tooling in CI                                                  |
| Backend                  | Supabase Auth, PostgreSQL with RLS, private Storage, TypeScript/Deno Edge Functions                |
| Tests                    | Node test runner with `tsx`, Playwright, database verification SQL, Anchor/Mocha lifecycle tests   |
| Delivery                 | GitHub Actions and Vercel; hosted Supabase services                                                |

Exact dependency versions are pinned in the package manifests and lockfiles. A narrowly patched copy of `anchor-syn` is included for IDL compiler compatibility; its provenance and changes are documented in [vendor/anchor-syn/TRUSTLAYER-PATCH.md](vendor/anchor-syn/TRUSTLAYER-PATCH.md).

## Run locally

### Prerequisites

- Git
- Node.js **22.14 or newer within Node 22** and npm **10**; the repository declares npm 10.9.8
- Phantom or Solflare for interactive wallet testing
- A separate Supabase development project for account, file and database integration work

Rust, Anchor, Solana CLI and Docker are not required just to start the frontend. They are needed for their respective contract or local-database test suites.

### Start the frontend

```bash
git clone https://github.com/mwebidouglas08-netizen/Trustlayer.git
cd Trustlayer
npm ci
cp .env.example apps/web/.env.local
```

**Before starting, edit `apps/web/.env.local`.** The example contains public settings for the shared deployment. Replace the Supabase URL and publishable key with your development project's values, and set `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Do not use the shared backend for automated fixture creation or destructive tests.

```bash
npm run dev
```

Open **http://localhost:3000**. The development server binds to `0.0.0.0`. The frontend proxies Solana requests through `/api/rpc`; the browser should not receive a credential-bearing provider URL.

To run a production build locally:

```bash
npm run build
npm run start
```

### Set up a development backend

For a separate hosted Supabase project:

1. Apply the repository migrations in order using your normal reviewed migration process. Check existing migration history before applying anything to a non-empty project.
2. Enable **Solana Web3 authentication**. Set the Auth site URL and allowed URLs for your development origin and profile route.
3. Deploy `trustlayer-verify-wallet`, `trustlayer-sync-transaction` and `trustlayer-health` from `supabase/functions/`.
4. Configure the sync function's server-side `TRUSTLAYER_SOLANA_RPC_URL` for Devnet. Review each function's origin policy for your intended host.
5. Point the frontend at this project and verify sign-in, wallet linking and private-file access with test accounts.

Local Supabase is useful for schema and authorization tests, but starting its containers alone does not reproduce the hosted wallet-auth configuration. See [the backend setup notes](docs/supabase-deployment.md) and [`supabase/config.toml`](supabase/config.toml).

## Configuration

Copy values from [.env.example](.env.example); keep actual secrets out of Git.

| Variable                               | Location                | Purpose                                                    |
| -------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SOLANA_CLUSTER`           | Web build               | Use `devnet` for this deployment                           |
| `NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID`    | Web build               | Deployed escrow program address                            |
| `NEXT_PUBLIC_USDC_MINT`                | Web build               | Exact mint configured in the on-chain Config account       |
| `SOLANA_RPC_URL`                       | Web server only         | RPC upstream; must serve the configured cluster            |
| `NEXT_PUBLIC_SUPABASE_URL`             | Web build               | Your Supabase project URL                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Web build               | Public client key; authorization still depends on Auth/RLS |
| `NEXT_PUBLIC_APP_URL`                  | Web build               | App origin used for shared links                           |
| `TRUSTLAYER_SOLANA_RPC_URL`            | Sync Edge Function only | RPC used for independent receipt verification              |

`NEXT_PUBLIC_*` values are embedded at build time. Changing them requires a rebuild and deployment. Never place RPC credentials, a Supabase service-role key, wallet seed phrases or keypairs in a public variable.

### Shared Devnet identity

| Account                    | Public address                                 |
| -------------------------- | ---------------------------------------------- |
| Escrow program             | `7v6PxWejvNneG5TwZSntgj5ZjV6sgLSengjkVsct6V2G` |
| ProgramData                | `8VsMXpACHJ7HGi4N6ZuxXGiEsZJ455L2StGT8m5bLnLX` |
| Config PDA                 | `2RprsAqpuSFW1Kh6DQj58N46nupaHzQqyJwPhMPvkha8` |
| Configured test-token mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

The recorded read-only Devnet verification matched these identities and the published/local IDL, with six token decimals, a 100-basis-point fee and an unpaused Config. These are verification results at a point in time, not promises that settings never change. Recheck before a release. SOL pays network fees; a different test-token mint cannot fund this escrow.

## Codebase map

```text
apps/web/
  app/                         Next.js routes, layouts, manifest and icons
    api/rpc/                   Restricted same-origin Solana RPC proxy
    app/agreements/            Proposal and accepted-agreement escrow routes
    app/transactions/          On-chain escrow creation and detail routes
  components/                  Wallet/account providers and feature screens
  lib/                         Escrow client, auth, sync, exports and validation
  tests/                       Unit and handler regression tests
  public/                      Install icons and network-only service worker
programs/trustlayer_escrow/
  src/lib.rs                   Contract instructions, accounts, states and errors
  tests/                       Local-validator security and lifecycle tests
supabase/
  migrations/                  Versioned schema, policies and restricted RPCs
  functions/                   Wallet verification, receipt sync and health
  tests/                       Database tests
  verification/                Workspace and wallet-challenge SQL regressions
scripts/                       Read-only verifier, CI helpers and encoding checks
tests/e2e/                     Browser regression suite
docs/                          Architecture, operations and verification records
vendor/anchor-syn/             Documented Anchor build-tool compatibility patch
.github/workflows/ci.yml        Web, database and isolated-contract checks
```

Useful starting points: [contract](programs/trustlayer_escrow/src/lib.rs), [escrow client](apps/web/lib/escrow.ts), [wallet authentication](apps/web/lib/wallet-auth.ts), [accepted-agreement handoff](apps/web/components/AgreementEscrow.tsx), [transaction UI](apps/web/components/TransactionFlow.tsx), and [receipt verifier](supabase/functions/trustlayer-sync-transaction/index.ts).

## Tests and verification

### Web checks

```bash
npm run check                  # SQL encoding, lint, TypeScript, unit tests, build
npm run test:contract:types     # Type-check the contract test client
node --test scripts/verify-devnet.test.mjs scripts/ci-localnet-identity.test.mjs

npx playwright install --with-deps chromium
npm run build
npm run test:e2e
```

Playwright starts its own production server on port **3100** by default. `TEST_BASE_URL` targets an already-running server instead. The suite includes desktop and mobile-sized Chromium projects; it does not prove native iOS wallet behavior or approve real wallet prompts.

### Local database checks

Install Docker and Supabase CLI **2.65.5** to match CI. These commands are for the disposable local database only:

```bash
supabase start
supabase db reset
supabase test db

psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -v ON_ERROR_STOP=1 -f supabase/verification/workspace.sql
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -v ON_ERROR_STOP=1 -f supabase/verification/challenges.sql
```

**Never run a reset against the shared hosted database.** Do not rewrite already-applied migration history to make a local environment appear current.

### Contract checks

The [CI contract job](.github/workflows/ci.yml) is the reproducible reference: it installs pinned Anchor/Solana tooling, creates disposable identities, aligns the Localnet program address before compilation, builds the IDL, runs a fresh upgradeable validator, runs host tests and checks for lockfile drift.

For local contract work, use a **separate disposable checkout and test wallet**. Do not run `anchor keys sync`, deploy, or copy CI identities into your Devnet deployment checkout. The committed program address is the deployed identity; a new local keypair will not match it automatically. The CI identity helper intentionally refuses execution outside GitHub Actions.

Host-side tests, with a compatible Rust toolchain installed:

```bash
cargo test --locked -p trustlayer_escrow --lib
```

Host tests do not replace SBF compilation or validator tests. The Anchor CLI installer and the project build use different Rust toolchains in CI; preserve that separation rather than applying one old compiler to the whole workspace.

### Read-only Devnet verification

Run from the repository so Node can resolve its dependencies. Supply your existing public IDL generated for the deployed program—not an IDL rewritten with a disposable CI address:

```bash
node scripts/verify-devnet.mjs target/idl/trustlayer_escrow.json
```

This checks the network, program/ProgramData identities, authority, Config, mint and full IDL equality. It does not sign or send transactions. For a real payment receipt:

```bash
read -r -p 'Public transaction signature: ' SIGNATURE
solana confirm --verbose --url https://api.devnet.solana.com "$SIGNATURE"
```

A release test should cover buyer creation/funding, seller delivery, buyer release, dispute outcomes and backend receipt acknowledgement using test assets. Do not report a mocked test or simulation as a completed Devnet payment.

## Deployment

1. Run the checks and review the PR. Keep web, database and contract checks enabled.
2. Configure the hosting platform's production environment. The frontend cluster, server RPC, Edge Function RPC, program ID and mint must agree.
3. Configure Supabase Auth URLs and Edge Function origin policies for the actual app host. A preview hostname is not automatically authorized.
4. Merge reviewed changes and verify which commit the production deployment serves. A push or successful preview is not proof of production promotion.
5. Re-run read-only deployment checks, then complete a two-wallet Devnet lifecycle and verify the corresponding Supabase records.

A frontend deployment does **not** upgrade the Solana program or deploy Edge Functions. Treat those as separate, reviewed operations. No upgrade or configuration reset is needed merely to publish a UI fix.

Supabase database previews require an eligible paid plan. A skipped **Supabase Preview** check can reflect that restriction; it is not the same as the isolated database CI tests failing.

## Troubleshooting

| Symptom                                             | Check or next step                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Connected wallet, but no private workspace          | Sign in with Solana, then complete wallet ownership verification in Profile.                                                               |
| Seller accepted, but buyer cannot see the next step | Refresh the proposal status; use the creator account and its verified buyer wallet. Accepted terms expose **Continue to escrow funding**.  |
| RPC network mismatch                                | Align `SOLANA_RPC_URL` with the build-time cluster and redeploy. Changing the wallet network alone does not change the server RPC.         |
| `InvalidDeadline`, error 6005 / `0x1775`            | Chain time reached the funding cutoff. Cancel the unfunded escrow and create newly agreed future terms. Do not disable the contract check. |
| Insufficient funds                                  | Check test SOL for fees/rent and the balance of the exact configured token mint. Creating escrow does not fund it.                         |
| Receipt confirmed, Supabase sync pending            | Check sign-in and verified ownership of the signing wallet. Retry synchronization; do not repeat the token transfer.                       |
| Confirmation timed out                              | Inspect the displayed signature in Devnet Explorer before retrying. A transport timeout is not proof that submission failed.               |
| Download does not appear on a phone                 | Try **Share / Save**, or use Safari/Chrome. Private files need **Prepare download** first. Browser/wallet-webview support varies.          |
| Verifier cannot find Node packages                  | Run the script from this repository, not a temporary directory outside its dependency tree.                                                |

## Security and current limits

- The program is upgradeable. Upgrade and arbitration authorities are trust assumptions, not features the UI can remove.
- Private records use authentication, RLS and restricted database functions. Edge handlers validate sessions before privileged operations; do not remove those checks because gateway JWT verification is disabled for publishable-key compatibility.
- The maximum program fee is 1%; an escrow snapshots its fee configuration. Review the contract rather than relying only on displayed amounts.
- Full private terms and attachments are not stored on-chain. Canonical escrow JSON must retain its exact bytes for hash verification.
- The installed app is network-dependent. Its service worker does not cache private pages, RPC responses or balances, and it cannot complete payments offline.
- Matching accepted proposals to existing escrows is not an atomic uniqueness guarantee. Avoid parallel creation from multiple tabs.
- Outstanding work includes independent security review, dependency advisory remediation, sync ordering/finality review, operational arbitration procedures and broader real-device/end-to-end testing. See the [production checklist](docs/production-checklist.md) and [verification record](docs/audit-continuation.md).

Report vulnerabilities using [SECURITY.md](SECURITY.md). Never include seed phrases, private keys, bearer tokens or credential-bearing RPC URLs in issues or screenshots.

## Contributing

Keep changes focused and explain the user-visible problem, the fix and the evidence. Add regression tests for authorization, signature handling, precision, transaction state and retry behavior. Run the relevant checks before opening a PR; record what could not be tested instead of treating it as passed.

Do not commit `.env` files, generated keypairs, `target/`, database dumps or build artifacts. Do not use force-upgrades to silence dependency advisories. Changes to contract identity, authorities, migrations or payment rules need explicit review.

### Further reading

- [Architecture](docs/architecture.md) and [threat model](docs/threat-model.md)
- [User guide](docs/user-guide.md) and [launch walkthrough](docs/launch-walkthrough.md)
- [Deployment](docs/deployment.md) and [verification](docs/verification.md)
- [Incident response](docs/incident-response.md) and [production checklist](docs/production-checklist.md)
- [Audit continuation and current implementation notes](docs/audit-continuation.md)

Some supporting documents describe earlier deployment stages. For a release decision, use the current source, the latest verification notes and fresh deployment evidence—not an older status claim.
