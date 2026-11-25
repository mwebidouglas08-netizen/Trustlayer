import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Terms — test-network draft.",
  intro:
    "These draft materials require qualified legal review before a production offering.",
  sections: [
    {
      title: "Permitted use",
      text: "Use this unaudited development release with test tokens only. Do not treat it as insurance, financial advice, a marketplace, or a guarantee that a counterparty will perform.",
    },
    {
      title: "Your responsibility",
      text: "Review agreement terms, independently confirm wallet addresses, and inspect every transaction before signing. Retain downloaded agreement files. Wallet connection does not establish seller consent or create a verified website account.",
    },
    {
      title: "Settlement and limits",
      text: "The configured program governs token movement; disputes rely on the current arbitrator. Private document storage does not provide a staffed arbitration SLA, appeals process, automatic refund or support guarantee.",
    },
    {
      title: "Production requirements",
      text: "A deployment operator must supply legally reviewed terms, privacy disclosures, contact channels and operational safeguards before accepting real-value usage. Mainnet payments are disabled in this code.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
