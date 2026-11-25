import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Privacy, with clear boundaries.",
  intro:
    "This describes the connected workspace. A production operator must still publish a legally reviewed privacy policy, contact details and retention procedures.",
  sections: [
    {
      title: "Public chain records",
      text: "Wallet addresses, escrow accounts, amounts, deadlines, state transitions and agreement hashes are public on Solana and may be permanent. Connecting a wallet exposes its public address to the app.",
    },
    {
      title: "Private workspace and local files",
      text: "Signed-in workspace agreements, activity and attachments are stored in Supabase. Row-level policies restrict access to the creator and verified counterparty. Drafts remain private until proposed. Attachments use a private bucket and 60-second download links. On-chain agreement JSON files, a separate flow, remain in browser storage and downloads.",
    },
    {
      title: "RPC infrastructure",
      text: "Requests pass through the web host and configured RPC provider, which may process IP addresses and request metadata under their own policies. The app uses a best-effort in-memory rate limiter. Account sessions are stored in browser storage by Supabase Auth. Files are not malware-scanned; avoid sensitive personal data. Participants cannot silently overwrite or delete shared evidence. Retention and deletion requests require an operator process.",
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
