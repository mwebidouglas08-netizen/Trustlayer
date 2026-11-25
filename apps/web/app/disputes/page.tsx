import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Disputes — know the limits.",
  intro:
    "An on-chain settlement mechanism is not a staffed arbitration service or a court process.",
  sections: [
    {
      title: "Opening a dispute",
      text: "The buyer may dispute a funded or delivery-submitted escrow. The seller may do so after its deadline. Once disputed, ordinary release is blocked until an authorized resolution.",
    },
    {
      title: "Resolution",
      text: "The current configured arbitrator can refund the full amount to the recorded buyer or pay the recorded seller less the agreed fee. Split payments, appeals, automatic refunds and in-app evidence hosting are not implemented.",
    },
    {
      title: "Agree on a review channel first",
      text: "Arrange evidence exchange, response expectations and a trusted operator contact before funding. Arbitration requires that signer to remain available. Management rotation can change the arbitrator for existing escrows. A deadline alone never moves funds.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
