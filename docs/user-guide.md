# User guide

## Sign in and verify your wallet

1. Open **Account & identity** at `/app/profile`.
2. Connect Phantom or Solflare, then choose **Sign in with Solana**. Review the message. It signs you into a Supabase account; it does not move tokens.
3. Choose **Verify connected wallet** and review the separate five-minute ownership challenge. The backend checks the signature and records the link. This makes proposals addressed to that wallet visible to your account.
4. Return with the same login wallet on another device. Wallet connection and account session are separate. Signing out clears the account session on this device, not on-chain funds.

Never share a seed phrase. Do not assume a wallet address proves someone's real-world legal identity.

## Create and share an agreement

1. Open **Agreements → New agreement**.
2. Enter a title, independently verified seller address, positive amount, future deadline and clear acceptance criteria.
3. **Save private draft** stores it in your Supabase account. No one else can read the draft.
4. Edit while it remains a draft; attach relevant files if needed. The draft and its files become shared when you send the proposal.
5. Verify your own wallet and choose **Send proposal**. Terms are now locked. Share the private link with your counterparty; possessing the URL alone does not grant access.
6. The seller signs into an account and verifies the named wallet, then reviews **Invitations**. Accepting records the exact proposal and acceptance time. It does not fund escrow, prove delivery, or appoint an arbitrator.

Creators can cancel a draft/proposal before acceptance. Accepted records cannot be edited or cancelled through the app. If terms need changing, create a new proposal and clarify supersession with your counterparty.

## Attachments and activity

Participants may upload PDF, PNG, JPEG or plain text files up to 10 MB. Downloads use short-lived private links. Shared files cannot be silently overwritten or deleted. Do not upload passwords, wallet secrets or unnecessary sensitive data. Files are not virus-scanned and should not be treated as independently verified evidence.

The agreement's activity panel and **Activity** page show saved collaboration events. Wallet transaction receipts are displayed separately and are session-local. Download/export your records as needed. Contact the deployment operator for retention or deletion requests; a staffed contact must be established before broad production use.

## Payments are not active

The owner confirmed the escrow program has not been deployed or audited. The database does not hold or move USDC. A saved amount, proposal or acceptance is never displayed as a funded escrow. The on-chain interface remains gated until reviewed deployment and testing are complete; mainnet is disabled.

If testing a future deployed escrow: create, save exact hashed terms, fund separately, verify confirmed state and only then release or dispute. A timeout is not proof a signature failed—check Explorer before retrying. See deployment and risk documentation first.
