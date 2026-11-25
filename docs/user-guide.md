# User guide

## First visit

Open `/app`, connect Phantom or Solflare, and confirm the network, program ID and token mint under Settings. Connection is not a payment or a verified website account. Never enter a seed phrase. If the program is not configured or RPC is unavailable, balances and signing stay unavailable.

## Buyer

1. Create a transaction using the independently verified seller wallet, positive USDC amount, future deadline, and clear terms.
2. Review the fee and seller net payout; sign creation. This uses SOL for fees and rent, not USDC funding.
3. Download the agreement JSON immediately. Share it and the escrow link with the seller and obtain agreement out-of-band.
4. Open the detail page, choose **Fund escrow**, review the confirmation text, and sign the USDC deposit. Funding uses your associated token account. Check your wallet's simulated transaction first.
5. After satisfactory delivery, choose **Accept & release payment**. Otherwise open a dispute and arrange evidence review with the configured arbitrator. There is no automatic refund or built-in staffed support service.

## Seller

Escrows naming your wallet appear in Transactions; unfunded ones appear under Awaiting funding. Import the buyer's JSON file in the escrow detail screen to verify its hash before relying on the terms. An unfunded agreement can be cancelled. Once funded, submit a delivery claim and send evidence separately. After the deadline, you may open a dispute if the buyer is inactive. The arbitrator can refund or pay you; it is not an automatic release.

## Operator

Connect the configured management or arbitration wallet at `/staff`. Management can pause/resume new escrows and deposits while preserving exits. Arbitrators inspect an escrow by address and select a full refund or seller payout after external evidence review. No user directory, private case queue or audit database is exposed by these routes. Authority rotation uses the secured operator script or multisig tooling, not a browser secret.

## Recovery and limitations

- A confirmation timeout includes the submitted signature. Check it in Explorer before trying again; a timeout is not proof of failure.
- Refresh updates confirmed chain state. Deadlines may require refresh before newly available actions appear.
- Switching accounts clears cached wallet data. Disconnecting does not cancel transactions.
- Activity is session-local, not a permanent audit trail.
- Terms are stored only in this browser and your downloaded files. Clearing site storage removes local copies, not funds. SHA-256 verification proves matching bytes, not physical delivery or seller consent.
- Arbitrator availability, upgrade authority security and RPC integrity matter. Mainnet is disabled; use test tokens only.
