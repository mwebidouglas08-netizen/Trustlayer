import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Keypair,
  SystemProgram,
  Transaction,
  SendTransactionError,
} from "@solana/web3.js";
import { EscrowClient } from "../lib/escrow";

function fixture() {
  const payer = Keypair.generate();
  let submitted = 0;
  const client = Object.create(EscrowClient.prototype);
  client.provider = {
    publicKey: payer.publicKey,
    wallet: {
      signTransaction: async (tx: Transaction) => {
        tx.partialSign(payer);
        return tx;
      },
    },
    connection: {
      getLatestBlockhash: async () => ({
        blockhash: Keypair.generate().publicKey.toBase58(),
      }),
      sendRawTransaction: async () => {
        submitted++;
        throw new SendTransactionError({
          action: "simulate",
          signature: "",
          transactionMessage: "custom program error: 0x1775",
          logs: [
            "Program log: AnchorError. Error Code: InvalidDeadline. Error Number: 6005.",
          ],
        });
      },
    },
  };
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    }),
  );
  return { client, tx, submitted: () => submitted };
}
test("expiry while wallet approval is open blocks RPC submission", async () => {
  const f = fixture();
  await assert.rejects(
    f.client.send(f.tx, [], async () => {
      throw new Error("deadline expired during approval");
    }),
    /expired during approval/,
  );
  assert.equal(f.submitted(), 0);
});
test("InvalidDeadline preflight failure is not described as an uncertain broadcast", async () => {
  const f = fixture();
  await assert.rejects(f.client.send(f.tx), (error: Error) => {
    assert.match(error.message, /deadline expired/);
    assert.match(error.message, /not broadcast/);
    assert.doesNotMatch(error.message, /may have been submitted/);
    return true;
  });
  assert.equal(f.submitted(), 1);
});
