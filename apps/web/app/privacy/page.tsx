import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Privacy notice — development release.",
  intro:
    "This is a factual description of the wallet-first release, not a final legally reviewed privacy policy.",
  sections: [
    {
      title: "Public chain records",
      text: "Wallet addresses, escrow accounts, amounts, deadlines, state transitions and agreement hashes are public on Solana and may be permanent. Connecting a wallet exposes its public address to the app.",
    },
    {
      title: "Local agreements",
      text: "Created agreement terms are stored in this browser when storage permits and in files you download. Importing a JSON agreement verifies its hash locally. Do not put private evidence or secrets in these terms. Clearing site storage removes local copies, not public chain records.",
    },
    {
      title: "RPC infrastructure",
      text: "Requests pass through the web host and configured RPC provider, which may process IP addresses and request metadata under their own policies. The app uses a best-effort in-memory rate limiter. It does not operate a private evidence storage service or a user account database in this release.",
    },
    {
      title: "Before production",
      text: "A deployed operator must publish contact details, retention practices, applicable legal grounds and rights processes before collecting personal information or offering a production service.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
