import { backend } from "@/lib/supabase/client";

export type SyncAction =
  | "create_escrow"
  | "fund_escrow"
  | "mark_delivery_submitted"
  | "open_dispute"
  | "release_to_seller"
  | "resolve_dispute_refund_buyer"
  | "resolve_dispute_pay_seller"
  | "cancel_unfunded";

export type PendingTransactionSync = {
  signature: string;
  cluster: "devnet";
  action: SyncAction;
  escrowAddress: string;
  metadata?: {
    title: string;
    transactionType: "goods" | "service";
  };
  queuedAt: number;
};

const STORAGE_KEY = "trustlayer:pending-transaction-sync:v1";
const MAX_PENDING = 50;

let activeFlush: Promise<void> | null = null;

function readQueue(): PendingTransactionSync[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is PendingTransactionSync => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof item.signature === "string" &&
        item.cluster === "devnet" &&
        typeof item.escrowAddress === "string" &&
        typeof item.queuedAt === "number" &&
        [
          "create_escrow",
          "fund_escrow",
          "mark_delivery_submitted",
          "open_dispute",
          "release_to_seller",
          "resolve_dispute_refund_buyer",
          "resolve_dispute_pay_seller",
          "cancel_unfunded",
        ].includes(item.action)
      );
    });
  } catch {
    return [];
  }
}

function writeQueue(items: PendingTransactionSync[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_PENDING)));
}

export function enqueueTransactionSync(
  item: Omit<PendingTransactionSync, "queuedAt">,
) {
  const queue = readQueue();

  if (queue.some((entry) => entry.signature === item.signature)) {
    return;
  }

  queue.push({
    ...item,
    queuedAt: Date.now(),
  });

  writeQueue(queue);
}

export function flushPendingTransactionSync(): Promise<void> {
  if (activeFlush) return activeFlush;

  activeFlush = (async () => {
    const { data, error: sessionError } = await backend().auth.getSession();

    if (sessionError || !data.session) return;

    let queue = readQueue();

    for (const item of queue) {
      const { data: result, error } = await backend().functions.invoke(
        "trustlayer-sync-transaction",
        {
          body: {
            signature: item.signature,
            cluster: item.cluster,
            action: item.action,
            escrowAddress: item.escrowAddress,
            ...(item.metadata ? { metadata: item.metadata } : {}),
          },
        },
      );

      if (error || result?.synced !== true) {
        console.warn(
          "TrustLayer synchronization remains pending:",
          error?.message ?? result?.error ?? "Unexpected response",
        );
        break;
      }

      // Re-read after awaiting the network: another transaction may have been queued.
      queue = readQueue().filter((entry) => entry.signature !== item.signature);

      writeQueue(queue);
    }
  })().finally(() => {
    activeFlush = null;
  });

  return activeFlush;
}
