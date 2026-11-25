import { InfoPage } from "@/components/InfoPage";
const content = {
  title: "Service status, not a promise.",
  intro:
    "This release does not have independent uptime monitoring or a public incident feed.",
  sections: [
    {
      title: "Web liveness",
      text: "The /api/health endpoint reports web liveness and whether deployment variables are present. It does not certify RPC, program or arbitration readiness.",
    },
    {
      title: "Chain readiness",
      text: "After wallet connection, the app verifies network genesis, published program IDL, mint and decimals, then reads confirmed account state. Errors are shown rather than substituted with simulated balances.",
    },
    {
      title: "Operational readiness",
      text: "The operator must monitor RPC, authority availability and program state before offering escrow services. A responsive website alone does not mean settlement infrastructure is ready.",
    },
  ],
};
export default function Page() {
  return <InfoPage {...content} />;
}
