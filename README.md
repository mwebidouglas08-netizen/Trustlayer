# Trustlayer

A private agreement workspace with Supabase-backed accounts, verified wallet identities, shared documents and a separate Solana escrow client. **The backend is deployed. Escrow payments are not deployed or audited and remain disabled.**

## What is implemented

- Native Supabase **Sign in with Solana**, using Phantom/Solflare message signatures rather than passwords or seed phrases.
- Separate expiring, one-use Ed25519 wallet-link challenges verified in an authenticated Edge Function.
- Saved private drafts, wallet-addressed invitations, locked proposal/acceptance records, profile edits and persistent agreement activity.
- Participant-only attachments in a private bucket, MIME/size restrictions and 60-second download URLs. No silent participant overwrite/delete.
- A redesigned responsive workspace, agreement library/detail screens, account onboarding, status checks and explicit error/loading states.
- Separate wallet-signed escrow flows once a reviewed program is deployed. No database field can manufacture an on-chain payment.

The application does not use demonstration balances or fabricate successful payments. A saved or accepted agreement is **not** a funded escrow.

## Connected deployment

The owner selected **Dev3hackathon** (`azyycklgfzmyxpztqugw`, us-west-1). Five migrations and two Edge Functions were deployed through the Supabase connector. See [deployment report](docs/supabase-deployment.md) for the exact inventory, verification and outstanding blockers.

Public browser configuration is in `apps/web/lib/supabase/deployment.ts`, overridable through environment variables. Its publishable key is intentionally public and has no privileged access. **No service-role key or wallet secret belongs in the frontend or Git.**

The supplied production website is `https://web-xi-nine-d4ej5g61wk.vercel.app/`. At verification it still served the original scaffold. Pushing this branch is not the same as promoting a Vercel production deployment; Vercel must be connected or the owner must promote the reviewed branch.

## Development

Use Node 22 / npm 10:

```sh
npm ci
cp .env.example apps/web/.env.local
npm run dev                 # binds 0.0.0.0:3000
npm run check               # lint, type checks, unit tests, production build
npm run test:contract:types
```

Use a **separate staging Supabase project** for integration tests that create real users/files. The shipped public defaults point to the owner-selected live backend. Do not run destructive database resets against it.

```sh
# With the production build served on localhost:3000:
npm run test:e2e:sandbox     # bundled Linux Chromium, desktop + mobile
# Or with ordinary Playwright Chromium already installed:
npm run test:e2e
```

## Database and contract verification

```sh
# LOCAL Docker-backed Supabase only:
supabase start
supabase db reset
supabase test db
# Optional operator verification; scripts always roll back their fixtures:
psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/verification/workspace.sql
psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/verification/challenges.sql

# Requires Rust, Solana and Anchor. Not a substitute for an audit:
anchor build
anchor keys sync
anchor build
anchor test --skip-build
cargo test -p trustlayer_escrow --lib
```

Migration filenames now match the versions actually applied to the selected Supabase project. A separate environment that applied the older pre-deployment scaffold filenames needs deliberate migration-history reconciliation, not blindly replaying them. Do not commit generated wallet keys or `target/`.

## Launch blockers—not hidden by UI

- Solana deployment, matching published IDL, initialized config, token/network setup and successful runtime tests.
- Independent security audit and remaining SDK dependency advisory resolution.
- Vercel production promotion and real two-account/two-wallet acceptance testing, including upload/download and session expiration.
- Operational arbitration, support contact, retention/deletion processes, malware scanning, quotas/abuse controls and legal-reviewed policies.
- Email SMTP is not configured; the UI uses native wallet authentication, not a pretend email service.

See [architecture](docs/architecture.md), [user guide](docs/user-guide.md), [deployment](docs/deployment.md), [verification](docs/verification.md), [security](SECURITY.md), and [production gates](docs/production-checklist.md).
