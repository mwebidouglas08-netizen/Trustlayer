import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const id = process.env.NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID;
  return NextResponse.json(
    {
      ok: true,
      service: "trustlayer-web",
      timestamp: new Date().toISOString(),
      deploymentConfigured:
        !!id &&
        id !== "TRusT11111111111111111111111111111111111111" &&
        !!process.env.NEXT_PUBLIC_USDC_MINT,
      chainReadiness: "not-probed",
      note: "Liveness only. This endpoint does not assert RPC, program, or arbitration readiness.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
