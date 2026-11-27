import { NextRequest, NextResponse } from "next/server";
import { validRpcRequest } from "@/lib/rpc-policy";
export const dynamic = "force-dynamic";
// Best-effort per-instance abuse protection. Deploy behind a shared platform rate limiter too.
const buckets = new Map<string, { count: number; reset: number }>();
function permitted(ip: string): boolean {
  const now = Date.now();
  for (const [key, bucket] of buckets)
    if (bucket.reset < now) buckets.delete(key);
  const bucket = buckets.get(ip) || { count: 0, reset: now + 60000 };
  if (buckets.size >= 5000 && !buckets.has(ip)) return false;
  bucket.count++;
  buckets.set(ip, bucket);
  return bucket.count <= 120;
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== request.nextUrl.origin &&
    origin !== `https://${request.headers.get("host")}` &&
    origin !== `http://${request.headers.get("host")}`
  )
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  if (
    !permitted(
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown",
    )
  )
    return NextResponse.json(
      { error: "Too many requests. Retry in one minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

  if (cluster === "localnet") {
    const localRpc = process.env.SOLANA_RPC_URL;

    if (
      process.env.NODE_ENV !== "development" ||
      (localRpc !== "http://127.0.0.1:8899" &&
        localRpc !== "http://localhost:8899")
    ) {
      return NextResponse.json(
        { error: "Localnet is only available through the local development server." },
        { status: 503 },
      );
    }
  } else if (cluster !== "devnet" && cluster !== "testnet") {
    return NextResponse.json(
      { error: "This release supports test networks only" },
      { status: 503 },
    );
  }
  try {
    const reader = request.body?.getReader();
    if (!reader)
      return NextResponse.json(
        { error: "Request body required" },
        { status: 400 },
      );
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        return NextResponse.json(
          { error: "Request too large" },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (
      !validRpcRequest(payload, process.env.NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID)
    )
      return NextResponse.json(
        { error: "Unsupported RPC request" },
        { status: 400 },
      );
    const upstream =
      process.env.SOLANA_RPC_URL || `https://api.${cluster}.solana.com`;
    const response = await fetch(upstream, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: text,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
      return NextResponse.json(
        { error: "RPC provider unavailable. Try again shortly." },
        { status: 502 },
      );
    return new NextResponse(await response.text(), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "RPC provider timeout or invalid upstream response" },
      { status: 502 },
    );
  }
}
