# Deployment

## Web

1. Install Node 22 / npm 10, run `npm ci` and `npm run check`.
2. Copy `.env.example` to `apps/web/.env.local` for local work, or set the same variables on your host.
3. Set `NEXT_PUBLIC_SOLANA_CLUSTER`, the **deployed** `NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID`, and the exact `NEXT_PUBLIC_USDC_MINT` initialized on-chain.
4. Set server-only `SOLANA_RPC_URL` to a reliable endpoint on that cluster. Never expose RPC credentials through a public variable. Genesis mismatch disables signing.
5. Build with `npm run build`; serve with `npm start`. On Vercel, use the monorepo root for installation and `apps/web` as the Next.js application, with workspace-aware build settings.
6. Rebuild whenever public environment variables change. The unconfigured UI is a preview, not an active escrow deployment.
7. Deploy behind HTTPS and a shared WAF/rate limiter. The RPC route has a bounded 64 KB body, method allowlist, same-origin checks, program enumeration restriction and a best-effort per-instance quota, but is not a distributed anti-abuse system. Configure trusted forwarded-IP headers and upstream provider quotas.

The sandbox preview binds to `0.0.0.0` and accepts `*.e2b.app` for development. Browser calls use relative `/api/rpc`, never sandbox localhost. Production does not need a websocket credential exposed to the browser.

## Build and local program tests

Install Rust, Solana CLI **1.18.26**, Anchor CLI **0.30.1**, and the root npm dependencies. Run from the repository root:

```sh
anchor build
anchor keys sync
anchor build
anchor test --skip-build
cargo test -p trustlayer_escrow --lib
```

Anchor generates the local program keypair under ignored `target/deploy`. `anchor keys sync` updates the root program IDs and Rust `declare_id!`; review those changes before committing a deployment identity. The tests require a fresh upgradeable local-validator deployment so bootstrap can verify `ProgramData.upgrade_authority_address`. Do not reuse a pre-initialized singleton between full test runs.

The SBF build requires dependencies and platform tools from hosts unavailable in the restricted implementation sandbox. Run the contract CI job and resolve any toolchain/dependency compatibility issues before deploying. Record a Cargo lockfile from the successfully tested toolchain rather than assuming unpinned transitive resolution is reproducible.

## Devnet activation (operator-owned wallet)

Do not paste key material into chat or source files. Use a secured local CLI wallet; devnet requires test SOL.

```sh
# After building, synchronizing keys, rebuilding and passing tests:
anchor deploy --provider.cluster devnet
# Keep the deployed address consistent across Rust, Anchor.toml, env and IDL.
anchor idl init --provider.cluster devnet \
  --filepath target/idl/trustlayer_escrow.json <DEPLOYED_PROGRAM_ID>
# For a previously published IDL, use `anchor idl upgrade` instead.

# Initialization is authorized only for the deployed program's upgrade authority.
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=/absolute/path/to/secured-devnet-wallet.json
export USDC_MINT=<SIX_DECIMAL_TEST_SPL_MINT>
export FEE_RECIPIENT=<RECIPIENT_PUBLIC_KEY>
export ARBITRATION_AUTHORITY=<ARBITRATOR_PUBLIC_KEY>
export FEE_BPS=0
npx ts-node --project programs/trustlayer_escrow/tsconfig.json scripts/initialize.ts
```

The published IDL must be from this exact program revision. This changes the `openDispute` account name to `participant` and adds authenticated configuration accounts/instructions; do not reuse an older client IDL. Config and Escrow data layouts are unchanged. Operators must explicitly review upgrade compatibility before touching any pre-existing deployment.

Connect two test wallets, obtain test tokens of the configured mint, then exercise creation → funding → delivery → release. Separately exercise both dispute outcomes and seller timeout escalation. Save explorer signatures and verified agreement files. No mainnet activation path is provided by this release.

## Authority rotation

```sh
# Both files stay local. The current authority is ANCHOR_WALLET.
export NEW_AUTHORITY_KEYPAIR=/absolute/path/to/new-authority.json
export ARBITRATION_AUTHORITY=<NEW_ARBITRATOR_PUBLIC_KEY>
npx ts-node --project programs/trustlayer_escrow/tsconfig.json scripts/rotate-authorities.ts
```

This script is for ordinary local signers; multisig deployments must construct the equivalent instruction through their multisig tooling. Protect the upgrade authority separately. Rotation changes the arbitrator for existing escrows; publicize and audit this governance power.

## Optional Supabase schema

Requires Docker and the Supabase CLI:

```sh
supabase start
supabase db reset
supabase test db
```

For a remote project, apply migrations using your secured CLI connection. The second migration revokes sensitive writes and adds constraints; pre-existing invalid records or duplicate primary wallets must be reviewed before applying it. Signup is disabled in the local template because this release is wallet-first. Do not enable an account-based product until authenticated backend functions, storage controls and row-isolation tests are implemented.
