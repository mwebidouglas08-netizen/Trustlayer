import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import {
  Connection,
  PublicKey,
} from "npm:@solana/web3.js@1.98.4";
import bs58 from "npm:bs58@6.0.0";

const ALLOWED_ORIGINS = new Set([
  "https://web-xi-nine-d4ej5g61wk.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function corsHeaders(req: Request): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });

  const origin = req.headers.get("origin");

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

const reply = (
  body: unknown,
  status = 200,
  req?: Request,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: req
      ? corsHeaders(req)
      : { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const PROGRAM_ID = Deno.env.get("TRUSTLAYER_PROGRAM_ID") ??
  "7v6PxWejvNneG5TwZSntgj5ZjV6sgLSengjkVsct6V2G";

const TOKEN_PROGRAM_ID =
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const DISCRIMINATORS: Record<string, number[]> = {
  create_escrow: [253, 215, 165, 116, 36, 108, 68, 80],
  fund_escrow: [155, 18, 218, 141, 182, 213, 69, 201],
  mark_delivery_submitted: [68, 65, 110, 173, 58, 1, 189, 217],
  release_to_seller: [218, 83, 41, 9, 49, 54, 255, 56],
  open_dispute: [137, 25, 99, 119, 23, 223, 161, 42],
  resolve_dispute_refund_buyer: [152, 18, 126, 80, 143, 21, 119, 32],
  resolve_dispute_pay_seller: [28, 158, 53, 181, 234, 222, 9, 190],
  cancel_unfunded: [7, 11, 92, 226, 201, 56, 156, 158],
};

const EXPECTED_STATES: Record<string, number> = {
  create_escrow: 0,
  fund_escrow: 1,
  mark_delivery_submitted: 2,
  open_dispute: 3,
  release_to_seller: 4,
  resolve_dispute_pay_seller: 5,
  resolve_dispute_refund_buyer: 6,
  cancel_unfunded: 7,
};

// Valid current states when verifying a historical event.
// The current escrow account may have advanced since that event.
const EVENT_REACHABLE_STATES: Record<string, number[]> = {
  create_escrow: [0, 1, 2, 3, 4, 5, 6, 7],
  fund_escrow: [1, 2, 3, 4, 5, 6],
  mark_delivery_submitted: [2, 3, 4, 5, 6],
  open_dispute: [3, 5, 6],
  release_to_seller: [4],
  resolve_dispute_pay_seller: [5],
  resolve_dispute_refund_buyer: [6],
  cancel_unfunded: [7],
};

const STATE_NAMES: Record<number, string> = {
  0: "created",
  1: "funded",
  2: "delivery_submitted",
  3: "disputed",
  4: "released",
  5: "resolved_to_seller",
  6: "refunded",
  7: "cancelled",
};

const ESCROW_ACCOUNT_DISCRIMINATOR =
  [31, 213, 123, 187, 186, 22, 218, 155];

const CONFIG_ACCOUNT_DISCRIMINATOR =
  [155, 12, 170, 224, 30, 250, 204, 130];

function equalBytes(a: Uint8Array, b: number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function hex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}

function key(data: Uint8Array, offset: number) {
  return new PublicKey(data.slice(offset, offset + 32));
}

function u64(data: Uint8Array, offset: number) {
  return new DataView(
    data.buffer,
    data.byteOffset,
    data.byteLength,
  ).getBigUint64(offset, true).toString();
}

function i64(data: Uint8Array, offset: number) {
  return Number(
    new DataView(
      data.buffer,
      data.byteOffset,
      data.byteLength,
    ).getBigInt64(offset, true),
  );
}

function stateText(state: number) {
  const value = STATE_NAMES[state];
  if (!value) throw new Error("Unknown escrow state.");
  return value;
}

function actorAccountIndex(action: string) {
  const indexes: Record<string, number> = {
    create_escrow: 5,
    fund_escrow: 5,
    mark_delivery_submitted: 1,
    open_dispute: 1,
    release_to_seller: 7,
    resolve_dispute_refund_buyer: 6,
    resolve_dispute_pay_seller: 7,
    cancel_unfunded: 1,
  };
  return indexes[action];
}

function escrowAccountIndex(action: string) {
  return action === "create_escrow" || action === "fund_escrow" ||
      action === "release_to_seller" ||
      action === "resolve_dispute_refund_buyer" ||
      action === "resolve_dispute_pay_seller"
    ? 1
    : 0;
}

function decodeEscrow(data: Uint8Array) {
  if (
    data.length < 310 ||
    !equalBytes(data.slice(0, 8), ESCROW_ACCOUNT_DISCRIMINATOR)
  ) {
    throw new Error("Invalid TrustLayer escrow account.");
  }

  const version = data[8];
  const escrowId = data.slice(9, 41);
  const buyer = key(data, 41);
  const seller = key(data, 73);
  const mint = key(data, 105);
  const tokenProgram = key(data, 137);
  const vault = key(data, 169);
  const amount = u64(data, 201);
  const feeBps = new DataView(
    data.buffer,
    data.byteOffset,
    data.byteLength,
  ).getUint16(209, true);
  const feeRecipient = key(data, 211);
  const agreementHash = hex(data.slice(243, 275));
  const deadline = i64(data, 275);
  const state = data[283];
  const fundedAt = i64(data, 286);
  const disputedAt = i64(data, 294);
  const settledAt = i64(data, 302);

  return {
    version,
    escrowId,
    buyer,
    seller,
    mint,
    tokenProgram,
    vault,
    amount,
    feeBps,
    feeRecipient,
    agreementHash,
    deadline,
    state,
    fundedAt,
    disputedAt,
    settledAt,
  };
}

function decodeConfig(data: Uint8Array) {
  if (
    data.length < 140 ||
    !equalBytes(data.slice(0, 8), CONFIG_ACCOUNT_DISCRIMINATOR)
  ) {
    throw new Error("Invalid TrustLayer configuration account.");
  }

  return {
    mint: key(data, 40),
    arbitrationAuthority: key(data, 106),
  };
}

Deno.serve(async (req) => {
  const replyForRequest = (body: unknown, status = 200) =>
    reply(body, status, req);

  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response(null, { status: 403 });
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    });
  }

  if (req.method !== "POST") {
    return replyForRequest({ error: "POST required." }, 405);
  }

  const authorization = req.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return replyForRequest({ error: "Authentication required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const rpcUrl = Deno.env.get("TRUSTLAYER_SOLANA_RPC_URL") ??
    "https://api.devnet.solana.com";

  if (!supabaseUrl || !serviceKey) {
    return replyForRequest({ error: "Backend configuration incomplete." }, 503);
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const token = authorization.slice(7);
  const { data: { user }, error: authError } =
    await db.auth.getUser(token);

  if (authError || !user) {
    return replyForRequest({ error: "Invalid or expired session." }, 401);
  }

  try {
    const reader = req.body?.getReader();

    if (!reader) return replyForRequest({ error: "Request body required." }, 400);

    const chunks: Uint8Array[] = [];
    let size = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;

      if (size > 8192) {
        await reader.cancel();
        return replyForRequest({ error: "Request too large." }, 413);
      }

      chunks.push(value);
    }

    const bodyBytes = new Uint8Array(size);
    let offset = 0;

    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const input = JSON.parse(new TextDecoder().decode(bodyBytes));

    const { signature, cluster, action, escrowAddress, metadata } = input;

    if (
      typeof signature !== "string" ||
      typeof cluster !== "string" ||
      typeof action !== "string" ||
      typeof escrowAddress !== "string"
    ) {
      return replyForRequest({ error: "Invalid synchronization request." }, 400);
    }

    if (cluster !== "devnet") {
      return replyForRequest({
        error: "This deployment currently supports Solana devnet only.",
      }, 400);
    }

    if (!DISCRIMINATORS[action]) {
      return replyForRequest({ error: "Unsupported escrow instruction." }, 400);
    }

    if (
      cluster === "devnet" &&
      rpcUrl.includes("api.mainnet-beta.solana.com")
    ) {
      return replyForRequest({ error: "RPC network configuration mismatch." }, 503);
    }

    const decodedSignature = bs58.decode(signature);

    if (decodedSignature.length !== 64) {
      return replyForRequest({ error: "Invalid transaction signature." }, 400);
    }

    const EXPECTED_PROGRAM_ID =
      "7v6PxWejvNneG5TwZSntgj5ZjV6sgLSengjkVsct6V2G";

    if (PROGRAM_ID !== EXPECTED_PROGRAM_ID) {
      return replyForRequest({
        error: "TrustLayer program configuration does not match this deployment.",
      }, 503);
    }

    const programId = new PublicKey(PROGRAM_ID);
    const requestedEscrow = new PublicKey(escrowAddress);
    const connection = new Connection(rpcUrl, "confirmed");

    const genesisHash = await connection.getGenesisHash();

    const DEVNET_GENESIS_HASH =
      "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

    if (genesisHash !== DEVNET_GENESIS_HASH) {
      return replyForRequest({
        error: "Configured Solana RPC does not point to the expected devnet.",
      }, 503);
    }

    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return replyForRequest({
        error: "Transaction not found at confirmed commitment. Retry shortly.",
        retryable: true,
      }, 409);
    }

    if (tx.meta?.err) {
      return replyForRequest({ error: "The Solana transaction failed." }, 422);
    }

    if (!tx.transaction.signatures.includes(signature)) {
      return replyForRequest({
        error: "The requested signature does not match the retrieved transaction.",
      }, 400);
    }

    // Get the transaction's position inside its block. Slot alone is
    // insufficient because several transactions can share one slot.
    const block = await connection.getBlock(tx.slot, {
      commitment: "confirmed",
      transactionDetails: "full",
      rewards: false,
      maxSupportedTransactionVersion: 0,
    });

    const transactionIndex = block?.transactions?.findIndex(
      (entry) => entry.transaction.signatures.includes(signature),
    ) ?? -1;

    if (transactionIndex < 0) {
      return replyForRequest({
        error: "Transaction ordering is not available yet. Retry shortly.",
        retryable: true,
      }, 503);
    }

    const message = tx.transaction.message as any;
    const staticKeys: PublicKey[] = message.staticAccountKeys ??
      message.accountKeys;

    const loaded = tx.meta?.loadedAddresses;
    const allKeys = [
      ...staticKeys,
      ...(loaded?.writable ?? []),
      ...(loaded?.readonly ?? []),
    ];

    const instructions = message.compiledInstructions ??
      message.instructions;

    if (!Array.isArray(instructions)) {
      return replyForRequest({ error: "Unsupported transaction message format." }, 400);
    }

    const matching: {
      instruction: any;
      index: number;
      accounts: PublicKey[];
      data: Uint8Array;
    }[] = [];

    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      const programIndex = instruction.programIdIndex;
      const instructionProgram = allKeys[programIndex];

      if (!instructionProgram?.equals(programId)) continue;

      const rawData = bs58.decode(instruction.data);
      if (
        rawData.length < 8 ||
        !equalBytes(rawData.slice(0, 8), DISCRIMINATORS[action])
      ) continue;

      const indexes: number[] = instruction.accountKeyIndexes ??
        instruction.accounts;

      matching.push({
        instruction,
        index: i,
        accounts: indexes.map((n) => allKeys[n]),
        data: rawData,
      });
    }

    if (matching.length !== 1) {
      return replyForRequest({
        error: "Expected exactly one matching TrustLayer instruction.",
      }, 400);
    }

    const match = matching[0];
    const actorIndex = actorAccountIndex(action);
    const escrowIndex = escrowAccountIndex(action);

    if (
      match.accounts.length <= Math.max(actorIndex, escrowIndex) ||
      !match.accounts[escrowIndex].equals(requestedEscrow)
    ) {
      return replyForRequest({ error: "Instruction accounts do not match the requested escrow." }, 400);
    }

    const actor = match.accounts[actorIndex];
    const requiredSigners = staticKeys.slice(
      0,
      message.header.numRequiredSignatures,
    );

    if (!requiredSigners.some((key) => key.equals(actor))) {
      return replyForRequest({ error: "The claimed actor did not sign this transaction." }, 403);
    }

    const [configAddress] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("config")],
      programId,
    );

    const [expectedEscrow] = action === "create_escrow"
      ? PublicKey.findProgramAddressSync(
        [
          new TextEncoder().encode("escrow"),
          match.data.slice(8, 40),
        ],
        programId,
      )
      : [requestedEscrow];

    if (!expectedEscrow.equals(requestedEscrow)) {
      return replyForRequest({ error: "Escrow PDA does not match the creation instruction." }, 400);
    }

    const [configInfo, escrowInfo] = await Promise.all([
      connection.getAccountInfo(configAddress, "confirmed"),
      connection.getAccountInfo(requestedEscrow, "confirmed"),
    ]);

    if (!configInfo?.owner.equals(programId)) {
      return replyForRequest({ error: "TrustLayer configuration account is invalid." }, 503);
    }

    if (!escrowInfo?.owner.equals(programId)) {
      return replyForRequest({ error: "Escrow account is not owned by TrustLayer." }, 400);
    }

    const config = decodeConfig(new Uint8Array(configInfo.data));
    const escrow = decodeEscrow(new Uint8Array(escrowInfo.data));

    const [derivedEscrow] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("escrow"), escrow.escrowId],
      programId,
    );

    if (
      !derivedEscrow.equals(requestedEscrow) ||
      escrow.version !== 1 ||
      !escrow.mint.equals(config.mint) ||
      !escrow.tokenProgram.equals(new PublicKey(TOKEN_PROGRAM_ID)) ||
      !EVENT_REACHABLE_STATES[action]?.includes(escrow.state)
    ) {
      return replyForRequest({
        error: "On-chain escrow identity, configuration or state verification failed.",
      }, 409);
    }

    if (!escrow.buyer.equals(match.accounts[5]) && action === "create_escrow") {
      return replyForRequest({ error: "Creation buyer does not match the escrow account." }, 400);
    }

    if (action === "create_escrow") {
      const instructionSeller = new PublicKey(match.data.slice(40, 72));

      if (
        !instructionSeller.equals(escrow.seller) ||
        u64(match.data, 72) !== escrow.amount ||
        hex(match.data.slice(80, 112)) !== escrow.agreementHash ||
        u64(match.data, 112) !== String(escrow.deadline) ||
        !escrow.buyer.equals(actor)
      ) {
        return replyForRequest({ error: "Creation instruction does not match the resulting escrow." }, 400);
      }
    }

    const isArbitrationAction =
      action === "resolve_dispute_refund_buyer" ||
      action === "resolve_dispute_pay_seller";

    if (
      isArbitrationAction &&
      !actor.equals(config.arbitrationAuthority)
    ) {
      return replyForRequest({ error: "Signer is not the configured arbitration authority." }, 403);
    }

    let actorUserId: string | null = null;

    if (!isArbitrationAction) {
      const { data: wallet, error: walletError } = await db
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .eq("public_key", actor.toBase58())
        .not("verified_at", "is", null)
        .maybeSingle();

      if (walletError || !wallet) {
        return replyForRequest({
          error: "Connect and verify this signing wallet in your TrustLayer account before synchronizing.",
        }, 403);
      }

      actorUserId = user.id;
    }

    const now = new Date().toISOString();
    const blockTime = tx.blockTime
      ? new Date(tx.blockTime * 1000).toISOString()
      : null;

    let transactionId: string;

    if (action === "create_escrow") {
      if (
        !metadata ||
        typeof metadata.title !== "string" ||
        !metadata.title.trim() ||
        metadata.title.trim().length > 120 ||
        !["goods", "service"].includes(metadata.transactionType)
      ) {
        return replyForRequest({
          error: "Creation requires a title and transaction type.",
        }, 400);
      }

      const { data: existing, error: existingError } = await db
        .from("transactions")
        .select("id,creation_signature,creator_user_id")
        .eq("cluster", cluster)
        .eq("escrow_pda", requestedEscrow.toBase58())
        .maybeSingle();

      if (existingError) {
        console.error("Creation history lookup failed:", existingError);
        return replyForRequest({
          error: "Transaction history lookup failed. Retry shortly.",
          retryable: true,
        }, 503);
      }

      if (existing) {
        if (
          existing.creation_signature !== signature ||
          existing.creator_user_id !== user.id
        ) {
          return replyForRequest({ error: "This escrow is already indexed." }, 409);
        }

        transactionId = existing.id;
      } else {
        const reference = `TL-${signature.slice(0, 16).toUpperCase()}`;

        const { data: created, error: createError } = await db
          .from("transactions")
          .insert({
            public_reference: reference,
            creator_user_id: user.id,
            buyer_user_id: user.id,
            seller_user_id: null,
            buyer_wallet: escrow.buyer.toBase58(),
            seller_wallet: escrow.seller.toBase58(),
            title: metadata.title.trim(),
            description: "",
            transaction_type: metadata.transactionType,
            amount_base_units: escrow.amount,
            token_mint: escrow.mint.toBase58(),
            cluster,
            program_id: programId.toBase58(),
            escrow_pda: requestedEscrow.toBase58(),
            vault_address: escrow.vault.toBase58(),
            agreement_version: 1,
            agreement_hash: escrow.agreementHash,
            delivery_deadline: new Date(escrow.deadline * 1000).toISOString(),
            state_mirror: "created",
            creation_signature: signature,
            last_event_slot: 0,
            last_event_transaction_index: -1,
            updated_at: now,
          })
          .select("id")
          .single();

        if (createError || !created) {
          console.error("Creation history insert failed:", createError);
          return replyForRequest({
            error: "Could not create transaction history record.",
            retryable: true,
          }, 503);
        }

        transactionId = created.id;
      }
    } else {
      const { data: existing, error: lookupError } = await db
        .from("transactions")
        .select("id,buyer_wallet,seller_wallet,program_id,token_mint")
        .eq("cluster", cluster)
        .eq("escrow_pda", requestedEscrow.toBase58())
        .maybeSingle();

      if (lookupError) {
        console.error("Escrow history lookup failed:", lookupError);
        return replyForRequest({
          error: "Transaction history lookup failed. Retry shortly.",
          retryable: true,
        }, 503);
      }

      if (!existing) {
        return replyForRequest({
          error: "Escrow history record is missing. Synchronize its creation first.",
        }, 409);
      }

      if (
        existing.program_id !== programId.toBase58() ||
        existing.token_mint !== escrow.mint.toBase58() ||
        existing.buyer_wallet !== escrow.buyer.toBase58() ||
        existing.seller_wallet !== escrow.seller.toBase58()
      ) {
        return replyForRequest({ error: "Indexed transaction does not match the on-chain escrow." }, 409);
      }

      transactionId = existing.id;
    }

    const resultingState = EXPECTED_STATES[action];

    const { data: priorEvent, error: priorEventError } = await db
      .from("transaction_events")
      .select(
        "id,transaction_id,action,actor_wallet,actor_user_id,escrow_address,resulting_state,slot,transaction_index,instruction_index",
      )
      .eq("cluster", cluster)
      .eq("signature", signature)
      .maybeSingle();

    if (priorEventError) {
      console.error("Prior event lookup failed:", priorEventError);
      return replyForRequest({
        error: "Event history lookup failed. Retry shortly.",
        retryable: true,
      }, 503);
    }

    if (priorEvent) {
      const exactDuplicate =
        priorEvent.transaction_id === transactionId &&
        priorEvent.action === action &&
        priorEvent.actor_wallet === actor.toBase58() &&
        priorEvent.actor_user_id === actorUserId &&
        priorEvent.escrow_address === requestedEscrow.toBase58() &&
        priorEvent.resulting_state === resultingState &&
        Number(priorEvent.slot) === tx.slot &&
        priorEvent.transaction_index === transactionIndex &&
        priorEvent.instruction_index === match.index;

      if (!exactDuplicate) {
        return replyForRequest({
          error: "Signature has already been associated with another event.",
        }, 409);
      }
    } else {
      const { error: eventError } = await db
        .from("transaction_events")
        .insert({
          transaction_id: transactionId,
          cluster,
          signature,
          action,
          actor_wallet: actor.toBase58(),
          actor_user_id: actorUserId,
          escrow_address: requestedEscrow.toBase58(),
          resulting_state: resultingState,
          slot: tx.slot,
          transaction_index: transactionIndex,
          block_time: blockTime,
          instruction_index: match.index,
        });

      if (eventError) {
        console.error("Event insert failed:", eventError);
        return replyForRequest({
          error: "Could not record verified transaction event. Retry shortly.",
          retryable: true,
        }, 503);
      }
    }

    const { data: mirrorAdvanced, error: mirrorError } = await db.rpc(
      "trustlayer_apply_event_mirror",
      {
        p_transaction_id: transactionId,
        p_slot: tx.slot,
        p_transaction_index: transactionIndex,
        p_state: stateText(escrow.state),
        p_funded_at: escrow.fundedAt > 0
          ? new Date(escrow.fundedAt * 1000).toISOString()
          : null,
        p_completed_at: escrow.settledAt > 0
          ? new Date(escrow.settledAt * 1000).toISOString()
          : null,
      },
    );

    if (mirrorError) {
      console.error("Transaction mirror update failed:", mirrorError);
      return replyForRequest({
        error: "Event recorded, but transaction history reconciliation is pending.",
        retryable: true,
        transactionId,
      }, 503);
    }

    return replyForRequest({
      synced: true,
      duplicate: Boolean(priorEvent),
      mirrorAdvanced: mirrorAdvanced === true,
      transactionId,
      action,
      resultingState: stateText(resultingState),
      currentState: stateText(escrow.state),
      signature,
      slot: tx.slot,
      transactionIndex,
    });
  } catch (error) {
    console.error("TrustLayer transaction synchronization failed:", error);

    return replyForRequest({
      error: "Transaction synchronization could not be completed. Retry shortly.",
      retryable: true,
    }, 503);
  }
});
