# Supabase deployment report — 2026-11-25

## Owner-approved target

- Project: **Dev3hackathon**
- Reference: `azyycklgfzmyxpztqugw`
- Region: us-west-1; PostgreSQL 17
- API: `https://azyycklgfzmyxpztqugw.supabase.co`
- Canonical website: `https://web-xi-nine-d4ej5g61wk.vercel.app`

The public schema was inspected before writes and contained no application tables. No existing application tables were dropped or overwritten. No plan upgrade or new project was created.

## Applied migrations

| Recorded version | Migration                    |
| ---------------- | ---------------------------- |
| 20261125084842   | trustlayer_initial           |
| 20261125084850   | trustlayer_harden_access     |
| 20261125085029   | trustlayer_workspace         |
| 20261125085043   | trustlayer_workspace_actions |
| 20261125085353   | trustlayer_workspace_limits  |

Repository filenames match these remote history entries. The original first two scaffold migrations were renamed to their actual first-deployment versions. SQL semantics match the deployed definitions; connector formatting is not byte-for-byte identical. If another database already applied the old scaffold versions, reconcile its migration history with the Supabase CLI before using `db push`. Do not repair history on unrelated projects or rerun baseline creation blindly.

## Deployed services

- `trustlayer-verify-wallet`: active Edge Function. Gateway JWT verification is disabled for publishable-key compatibility, **but the handler explicitly calls `auth.getUser(bearerJWT)` before any challenge read or privileged write**. It verifies raw Ed25519 over a server-created, account/address/domain/expiry-bound message. Only the service role can atomically consume a challenge and link a wallet. Duplicate wallet ownership and replay are rejected.
- `trustlayer-health`: active public read-only function. Checks agreement-table reachability and that `trustlayer-evidence` is private. Returns `paymentsReady: false`; this is intentional and accurate.
- `trustlayer-evidence`: private bucket, 10 MB per object, PDF/PNG/JPEG/plain-text only. Policies restrict reads to agreement participants and inserts to an authorized uploader's path. Shared files cannot be overwritten/deleted by participants. Metadata insert records a persistent activity event.
- Agreements and events: RLS-protected, direct mutation revoked; restricted RPCs enforce creator, verified counterparty, state transitions, deadline and quantity constraints. Values are saved as exact base units and exposed as generated text to avoid JavaScript number rounding.
- Profiles: created by an auth trigger, self-editable display/business fields with length limits. Account status remains privileged.

## Authentication

- Native Solana Web3 login was already enabled and remains enabled.
- Signup enabled; anonymous-user auth disabled; email confirmation retained; refresh rotation enabled.
- Site URL set to the owner-provided HTTPS origin.
- Broad unrelated wildcard redirect entries were removed. Exact `/app/profile` URLs are allowed for the canonical origin and the branch alias reported by the repository's Vercel check:
  `https://web-git-arena-d13247ec-e2d05b-mwebidouglas08-netizens-projects.vercel.app/app/profile`.
- Created one browser **publishable** API key, `trustlayer_web`; public defaults are committed intentionally. No privileged API key was retrieved or stored in Git. Edge Functions use Supabase-managed server secrets.
- No custom SMTP or CAPTCHA was configured by this task. Email onboarding is not offered by the new UI. Production abuse controls and email delivery, if required, still need operator setup.

## Actually verified

1. Connector service checks: Auth, database, REST and Storage each reported `ACTIVE_HEALTHY`.
2. Public deployed health function returned HTTP success with `databaseReady: true`, `privateStorageReady: true`, and `paymentsReady: false`.
3. Two live SQL regression transactions passed. Fixtures—including test auth users, wallet links and agreements—were **rolled back**. No demo accounts/transactions were seeded for users.
   - Creator can read own draft; seller cannot read unpublished draft.
   - Proposal becomes available to the verified seller, not unrelated accounts.
   - Authorized acceptance succeeds; outsider acceptance/direct mutation fail.
   - Privileged profile fields, wallet completion RPC and audit writes cannot be forged by clients.
   - Draft/proposal/acceptance produce real audit events.
   - Exact maximum-u64 base units survive storage and text readback.
   - Challenge completion is atomic and a repeated completion is rejected.
4. The actual Edge handler source was unit-tested with real Ed25519 keys/signatures and mocked auth/database transports: valid proof, forged proof, expired proof, missing/invalid bearer auth and replay handling.

## Not yet verified / not claimed

- A real human-wallet sign-in through the newly deployed Vercel frontend, followed by real authenticated Edge invocation and actual object upload/download. This needs the updated frontend promoted and two operator-controlled test wallets; unit mocks and SQL fixtures are not a claim that this end-to-end path passed.
- Production Vercel promotion: Vercel is disconnected from this session. The owner's supplied live URL still served the original scaffold when fetched. This branch can produce a Vercel preview, but preview checks do not certify promotion of that URL.
- Solana runtime/deployment/audit: not completed, no real-money payments enabled.
- Audit signoff, arbitration staffing, legal retention/deletion process, backup/restore drill, malware scanning, distributed quotas and incident support.

A healthy backend is not a production financial-services certification.
