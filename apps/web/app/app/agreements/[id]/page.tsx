import { AgreementDetail } from "@/components/AgreementWorkspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgreementDetail id={id} />;
}
