import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "A clearer agreement. A safer payment.",
  intro:
    "Trustlayer is a wallet-first escrow tool, not a marketplace or a guarantee of delivery.",
  sections: [
    {
      title: "01 · Agree",
      text: "The buyer records the seller, amount, deadline, and a hash of the terms. Download the exact agreement JSON and obtain seller consent separately before funding. Import the file to verify its on-chain hash.",
    },
    {
      title: "02 · Secure",
      text: "Sign the USDC deposit from your associated token account. The funds are held by a program-controlled vault. Both parties can inspect the escrow in the app and on Solana Explorer.",
    },
    {
      title: "03 · Complete",
      text: "After satisfactory delivery, the buyer releases payment. A buyer can open a dispute while funded; a seller can escalate after the deadline. The configured arbitrator can refund the buyer or pay the seller. There are no automatic refunds.",
    },
    {
      title: "Use test tokens only",
      text: "A deployed and initialized program, matching published IDL, test SOL and the configured six-decimal token are required. The unconfigured workspace is a preview; it never invents balances or confirmations.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
