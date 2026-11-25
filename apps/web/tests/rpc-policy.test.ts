import { test } from "node:test";
import assert from "node:assert/strict";
import { validRpcRequest } from "../lib/rpc-policy";
const request = (method: string, params: unknown[] = []) => ({
  jsonrpc: "2.0",
  id: 1,
  method,
  params,
});
test("RPC permits reads and signed submissions but not faucet or arbitrary methods", () => {
  assert.equal(validRpcRequest(request("getBalance")), true);
  assert.equal(validRpcRequest(request("sendTransaction")), true);
  assert.equal(validRpcRequest(request("requestAirdrop")), false);
  assert.equal(validRpcRequest(request("getLeaderSchedule")), false);
});
test("RPC rejects malformed requests and oversized batches", () => {
  for (const payload of [
    null,
    {},
    [],
    { jsonrpc: "2.0", method: "getHealth" },
    { ...request("getBalance"), params: {} },
    new Array(11).fill(request("getHealth")),
  ])
    assert.equal(validRpcRequest(payload), false);
});
test("program enumeration is restricted to configured escrow program", () => {
  assert.equal(
    validRpcRequest(request("getProgramAccounts", ["program"]), "program"),
    true,
  );
  assert.equal(
    validRpcRequest(request("getProgramAccounts", ["other"]), "program"),
    false,
  );
  assert.equal(
    validRpcRequest(request("getProgramAccounts", ["program"])),
    false,
  );
});
