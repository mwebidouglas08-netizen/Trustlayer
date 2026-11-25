import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Help for your next step.",
  intro:
    "Start with the in-app Help & resources guide. There is no staffed support contact configured for this test release.",
  sections: [
    {
      title: "Transaction questions",
      text: "Open the escrow detail page to inspect its state, counterparties, deadline, fee and Explorer links. Do not share private keys, seed phrases or confidential evidence in public issues.",
    },
    {
      title: "Pending or timed-out signatures",
      text: "Check the submitted signature in Solana Explorer and refresh the escrow before retrying. A confirmation timeout is not evidence that the transaction failed.",
    },
    {
      title: "Dispute questions",
      text: "Use the review channel agreed with your deployment operator. The app cannot promise response times or refunds without an operational arbitration service.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
