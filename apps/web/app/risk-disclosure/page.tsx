import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Understand the risks.",
  intro:
    "Test tokens only. This program and application have not received an independent security audit.",
  sections: [
    {
      title: "Irreversible transactions",
      text: "Wallet-signed transactions can transfer tokens irreversibly. Incorrect addresses, phishing, compromised devices, malicious RPC providers and program defects can cause loss. Verify network, mint, program and wallet previews independently.",
    },
    {
      title: "Counterparty and arbitration risk",
      text: "Blockchain records do not establish physical delivery, seller consent or legal enforceability. Disputes depend on an available configured arbitrator. Management and upgrade authority governance can change behavior and authorities.",
    },
    {
      title: "Operational limitations",
      text: "The app does not provide insurance, private evidence hosting, a staffed case-management service or guaranteed recovery. Deadlines do not automatically refund funds. Account rent and accidentally deposited vault surplus are not recoverable through this release.",
    },
    {
      title: "Asset risk",
      text: "Crypto assets and token issuers introduce price, liquidity, freezing, regulatory and network risks. Do not interpret a test-network token as real USDC or financial protection.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
