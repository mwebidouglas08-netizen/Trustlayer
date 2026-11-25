import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Security, without the guesswork.",
  intro:
    "This release is unaudited and restricted to Solana test networks. Do not use real-value assets.",
  sections: [
    {
      title: "Wallet-controlled actions",
      text: "You connect your own wallet and approve every transaction. The app never asks for a seed phrase. The escrow program controls the vault; your browser does not hold escrow funds.",
    },
    {
      title: "Explicit settlement rules",
      text: "The program restricts payout vaults, token mints, recipient ownership and instruction signers. Fees are capped at 1%. These safeguards are not a substitute for an independent audit.",
    },
    {
      title: "Governance and infrastructure",
      text: "The upgrade authority can change the program. Management can pause new deposits and rotate the arbitrator, including for existing cases. RPC integrity and arbitrator availability remain trust dependencies.",
    },
    {
      title: "What is not provided",
      text: "There is no hosted private evidence service, staffed dispute desk, insurance, or audit certification. Agreement files live in your browser and downloads. The repository documents outstanding dependency advisories and launch gates.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
