# Trustlayer: devnet-to-production walkthrough

## Status and boundaries

The repository already contains an Anchor escrow program at `programs/trustlayer_escrow/src/lib.rs`, its integration tests, wallet transaction client, and deployed Supabase collaboration backend. Do not replace it with a generic escrow example. It has not yet passed all remote contract checks or an independent audit. No production financial readiness is claimed.

Workspace agreements and on-chain escrow records are separate lifecycles. Accepting a Supabase proposal does not create, fund or automatically link an escrow. A future bridge must bind the exact terms/hash, participants, mint, amount and chain address and verify finalized chain data server-side; never trust a browser-supplied payment status.

## 1. Confirm the production website

In Vercel, open the existing project, confirm its Git repository and production branch (`main`), and find the production domain under Domains. A deployment-specific URL can keep showing an old build; use the domain assigned to the current production deployment. Do not assume every `vercel.app` URL automatically follows main.

Use that exact HTTPS origin for `NEXT_PUBLIC_APP_URL` and Supabase Authentication URL Configuration. The previously supplied origin is `https://web-xi-nine-d4ej5g61wk.vercel.app`. If the canonical domain changes, update it rather than keeping an old deployment URL. Add only needed exact redirect URLs such as `<origin>/app/profile`. Wallet challenges currently include the deployed backend's canonical Trustlayer domain; update the challenge function by a reviewed migration when changing that domain as well.

## 2. Set Vercel environment variables

Set these in the **Production** environment, and explicitly set staging equivalents for Preview. Rebuild/redeploy after changing NEXT_PUBLIC values: these are embedded at build time.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://azyycklgfzmyxpztqugw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_GnqX75t5QERfAiyPn8F-eQ_gby0WgKm
NEXT_PUBLIC_APP_URL=https://web-xi-nine-d4ej5g61wk.vercel.app
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

The publishable key is intentionally public, not a service key. For reliable devnet operation replace SOLANA_RPC_URL with your provider's devnet HTTPS endpoint; keep its API credential server-only. Public RPC is a starting point, not an availability guarantee.

**Only after deploying and initializing the tested program**, add:

| Variable                            | Value source                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID` | Actual address of your deployed program, matching Rust, Anchor.toml and published IDL  |
| `NEXT_PUBLIC_USDC_MINT`             | Actual six-decimal legacy SPL Token mint used to initialize Config on the same network |

Until those exist, leave them unset; payments correctly remain unavailable. The `TRusT111...` source placeholder is NOT a deployment address. Do not invent these two values or use a mainnet mint on devnet. A self-created devnet token is a test asset, not genuine USDC.

Never add ANCHOR_WALLET, private keys, recovery phrases, database passwords, Supabase service-role/secret keys or operator keypair JSON to Vercel frontend variables. Supabase Edge Functions use their project-managed server secrets. No separate browser websocket environment variable is required by this app.

## 3. Prove account creation and private storage

Use an HTTPS desktop browser with Phantom/Solflare, or the wallet's supported in-app browser on mobile. Ordinary mobile browsers without a wallet provider are not supported by the injected-wallet integration; this release does not implement universal mobile deep-link transport.

1. Open `/app/profile`, select/connect a wallet, then **Sign in with Solana**. First successful authentication creates the account; subsequent logins with the same wallet return to it. No SOL is spent.
2. Confirm the account profile loads. Save a display name; refresh and verify persistence. The database trigger creates the profile; a missing profile is a failure to investigate, not a reason to disable RLS.
3. Choose **Verify connected wallet**, inspect the ownership message, and sign it. This is a separate backend-verified link, not a payment.
4. Sign out, sign back in, and confirm the same profile returns. Switch/disconnect wallets and verify the UI updates. Account signout and wallet disconnect are deliberately separate actions.
5. With wallet/account A create a draft addressed to wallet B. In a separate browser profile sign in as B and verify B. Before proposal B must not see the draft; after proposal B must see it and be able to accept.
6. Upload a small PDF or text file, download as each participant, then try as unrelated account C. C must be denied. Validate expired signed links, oversized/disallowed file rejection, and session expiration.
7. Record outcomes and errors without recording JWTs or signatures in public tickets. Do not mark acceptance complete based only on health checks or mocked tests.

Current live management checks confirm signup enabled, Solana auth enabled and four services healthy. SMTP is not configured. If email signup is later required, implement the full confirmation/reset UI, configure your own SMTP provider and delivery domain, add abuse controls and test actual email delivery; do not disable confirmation just to hide a delivery problem.

## 4. Prepare a secured development machine

Use a Linux/macOS machine (or Linux VM) you control. Install Node 22/npm 10, Rust, Solana CLI 1.18.26, Anchor CLI 0.30.1 and an SPL Token CLI compatible with that Solana toolchain from their official distributions. The locked Anchor CLI install needs Rust 1.79 because an old transitive dependency fails on newer compilers. The SBF toolchain has its own compatibility constraints; stop on compile errors rather than assuming these versions guarantee a working build.

```sh
node --version
solana --version
anchor --version
npm ci
npm run check
npm run test:contract:types
anchor build
anchor keys sync
anchor build
anchor test --skip-build
cargo test -p trustlayer_escrow --lib
```

Run from the repository root on a clean local-validator environment, not against production. `anchor keys sync` changes source program IDs to the generated identity; review them. Securely back up the program keypair outside Git. Do not recreate it after deployment. Record the exact passing toolchain and Cargo.lock for reproducibility. Existing remote contract/database CI failures must be resolved, not bypassed.

Test creation, funding, release, cancellation, delivery, both dispute outcomes, expiry, unauthorized signers, incorrect mint/vault/PDA, fee limits, repeat settlement, pause behavior and authority rotation. Assert actual token balance deltas. Passing TypeScript compilation does not execute these tests.

## 5. Deploy ONLY to devnet

Use a dedicated operator-owned devnet wallet. Never paste its seed or keypair here. Initialization requires the deployed program's upgrade authority.

```sh
solana config set --url devnet
solana config set --keypair /absolute/path/to/your-devnet-wallet.json
solana address
solana balance
# Obtain test SOL through the devnet faucet; airdrops may be rate limited.
solana airdrop 2
```

Create a six-decimal **test** SPL token if you are not using an independently verified devnet USDC mint:

```sh
spl-token create-token --decimals 6
# Record the returned mint; replace TEST_MINT below with it.
spl-token create-account TEST_MINT
spl-token mint TEST_MINT 1000
```

Use fresh buyer/seller test wallets. Create their token accounts and distribute this test mint to the buyer. Never label it redeemable real USDC.

After all local contract tests pass:

```sh
anchor deploy --provider.cluster devnet --provider.wallet /absolute/path/to/your-devnet-wallet.json
solana program show DEPLOYED_PROGRAM_ID --url devnet
anchor idl init --provider.cluster devnet --provider.wallet /absolute/path/to/your-devnet-wallet.json --filepath target/idl/trustlayer_escrow.json DEPLOYED_PROGRAM_ID
```

Replace uppercase placeholders with actual public addresses/paths. Use `anchor idl upgrade` rather than init for an already published IDL. Verify the deployed program's upgrade authority and address before proceeding.

## 6. Initialize configuration once

These are **local operator variables, not Vercel variables**:

```sh
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=/absolute/path/to/your-devnet-wallet.json
export USDC_MINT=YOUR_ACTUAL_TEST_MINT
export FEE_RECIPIENT=YOUR_ACTUAL_FEE_RECIPIENT_PUBLIC_KEY
export ARBITRATION_AUTHORITY=YOUR_ACTUAL_ARBITRATOR_PUBLIC_KEY
export FEE_BPS=0
npx ts-node --project programs/trustlayer_escrow/tsconfig.json scripts/initialize.ts
```

Do not initialize twice or use someone else's mint/authority. Fee is bounded to 100 basis points (1%). Review governance powers: management can pause new exposure and rotate arbitration; program upgrade authority is a separate risk.

## 7. Connect and exercise the Dapp

Set the two deployment-dependent Vercel variables from step 2, rebuild, and inspect Settings. The client must validate cluster genesis, deployed IDL, Config ownership and mint before enabling actions. Do not remove those checks to fix a configuration mismatch.

With test wallets execute create → fund → delivery → release; separately exercise dispute/refund and dispute/pay-seller, seller deadline escalation and cancellation. Save transaction signatures and exact hashed agreement JSON. Check Explorer and token balances. An RPC timeout is not proof of transaction failure: verify the signature before retrying. Keep real funds out.

## 8. Real-money release gate

This release deliberately rejects mainnet. Changing the environment alone cannot safely activate it. Before a separately reviewed mainnet release:

- Resolve contract/database CI failures, remaining dependency advisories and all test findings.
- Commission an independent Solana security audit and remediate findings; publish tested commit/build hash.
- Establish secure upgrade/management/arbitration governance, hardware-backed keys/multisig processes, emergency pause/runbook and monitoring.
- Review exact mainnet mint/token program, IDL/deployment reproducibility and all client network checks. Add mainnet support only in a dedicated reviewed change.
- Add distributed RPC/storage abuse limits, malware handling, backups/restore drill, privacy retention/deletion and support escalation.
- Establish real dispute staffing, evidence handling, terms and applicable legal/compliance requirements.
- Stage limited exposure with monitoring and a rollback/incident plan; never promise perfect reliability.

No smart-contract deployment or audit was completed by writing this guide. The next concrete milestone is a fully passing local-validator suite followed by documented two-wallet devnet acceptance.
