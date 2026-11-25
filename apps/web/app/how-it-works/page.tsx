import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "A clearer agreement. A confident next step.",
  intro:
    "Trustlayer is a private collaboration workspace, not a marketplace, insurance policy or guarantee of delivery.",
  sections: [
    {
      title: "01 · Establish your identity",
      text: "Connect a Solana wallet and sign a login message to create an account session. A separate expiring ownership challenge links the wallet to your account. Neither action sends tokens.",
    },
    {
      title: "02 · Get the details right",
      text: "Create a private draft with a verified seller address, amount, deadline and clear acceptance criteria. Attach supporting files. Only your account can see a draft until you choose to send the proposal.",
    },
    {
      title: "03 · Share and agree",
      text: "The verified seller can review the proposal in Invitations and accept its locked terms. Both participants keep access to the record, activity and private attachments. The URL alone does not grant access.",
    },
    {
      title: "Payments are a separate launch gate",
      text: "The owner has not deployed or audited the Solana escrow program. Accepted terms are not a funded escrow. Payment controls remain disabled until that deployment, independent security review and operational safeguards are complete.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
