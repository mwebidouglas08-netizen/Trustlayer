import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Know the cost before you sign.",
  intro:
    "The actual platform fee comes from on-chain configuration, not a hard-coded marketing price.",
  sections: [
    {
      title: "Platform fee",
      text: "Each escrow snapshots its fee rate and recipient at creation. The program caps the rate at 100 basis points (1%). Review shows the fee and seller net payout before creation. Full buyer refunds do not deduct a platform fee.",
    },
    {
      title: "Network fees and rent",
      text: "Solana charges SOL for transactions and account creation. These are separate from the platform fee. Settled and cancelled accounts are not closed in this release, so account rent is not automatically returned.",
    },
    {
      title: "No hidden success claims",
      text: "An escrow is not funded just because it has been created. Payment success is shown only after on-chain confirmation. Failed transactions can still incur network fees.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
