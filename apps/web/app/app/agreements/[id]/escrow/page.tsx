import { AgreementEscrow } from "@/components/AgreementEscrow";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgreementEscrow id={id} />;
}
