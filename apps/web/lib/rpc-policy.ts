const allowed = new Set([
  "getAccountInfo",
  "getMultipleAccounts",
  "getProgramAccounts",
  "getBalance",
  "getTokenAccountsByOwner",
  "getTokenAccountBalance",
  "getLatestBlockhash",
  "getSignatureStatuses",
  "getBlockHeight",
  "sendTransaction",
  "simulateTransaction",
  "getMinimumBalanceForRentExemption",
  "getVersion",
  "getHealth",
  "getSlot",
  "getGenesisHash",
]);
export function validRpcRequest(payload: unknown, programId?: string): boolean {
  const requests = Array.isArray(payload) ? payload : [payload];
  return (
    requests.length > 0 &&
    requests.length <= 10 &&
    requests.every((value) => {
      if (!value || typeof value !== "object") return false;
      const item = value as {
        jsonrpc?: unknown;
        method?: unknown;
        params?: unknown;
        id?: unknown;
      };
      if (
        item.jsonrpc !== "2.0" ||
        typeof item.method !== "string" ||
        !allowed.has(item.method) ||
        (typeof item.id !== "string" && typeof item.id !== "number")
      )
        return false;
      if (item.params !== undefined && !Array.isArray(item.params))
        return false;
      if (
        item.method === "getProgramAccounts" &&
        (!programId || (item.params as unknown[])?.[0] !== programId)
      )
        return false;
      return true;
    })
  );
}
