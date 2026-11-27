// Read-only deployment verification. No signing keys, funding or configuration writes.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import anchor from "@coral-xyz/anchor";
const { Program } = anchor;
export function decodeConfig(idl, data, connection) {
  // Program normalizes raw Anchor IDL account and field names to camelCase.
  return new Program(idl, { connection }).coder.accounts.decode("config", data);
}
let stage = "initialization";
function at(next) {
  stage = next;
  console.log(`Checking: ${stage}`);
}
const expected = {
  program: "7v6PxWejvNneG5TwZSntgj5ZjV6sgLSengjkVsct6V2G",
  programData: "8VsMXpACHJ7HGi4N6ZuxXGiEsZJ455L2StGT8m5bLnLX",
  config: "2RprsAqpuSFW1Kh6DQj58N46nupaHzQqyJwPhMPvkha8",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  treasury: "CtGJWWzUxcZ6b8E58gmLCg4QjZjjK95czTryCxom4TNy",
  arbitrator: "2Go75PXNmGCcgsVAL5CvtrpMew5YUVmcwyK3AW9Hje8v",
  upgradeAuthority: "rKwguJWBE4u86KK3bdJq3YBbABbJZygZaymkvtT6ME5",
};
const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && !Array.isArray(v) && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
async function main() {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    {
      commitment: "finalized",
      disableRetryOnRateLimit: true,
      fetch: (url, options) =>
        fetch(url, { ...options, signal: AbortSignal.timeout(15000) }),
    },
  );
  at("Devnet RPC genesis");
  assert.equal(
    await connection.getGenesisHash(),
    "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
    "Devnet genesis",
  );
  at("expected PDA derivation");
  const program = new PublicKey(expected.program);
  const loader = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program,
  );
  const [programData] = PublicKey.findProgramAddressSync(
    [program.toBuffer()],
    loader,
  );
  assert.equal(config.toBase58(), expected.config, "Config PDA derivation");
  assert.equal(
    programData.toBase58(),
    expected.programData,
    "ProgramData derivation",
  );
  at("program, ProgramData and Config RPC lookup");
  const [p, d, c] = await connection.getMultipleAccountsInfo([
    program,
    programData,
    config,
  ]);
  at("program ownership and authority checks");
  assert(
    p?.executable && p.owner.equals(loader),
    "Executable upgradeable program",
  );
  assert.equal(p.data.readUInt32LE(0), 2, "Loader Program state");
  assert.equal(
    new PublicKey(p.data.subarray(4, 36)).toBase58(),
    expected.programData,
  );
  assert(d?.owner.equals(loader), "ProgramData owner");
  assert.equal(d.data.readUInt32LE(0), 3, "Loader ProgramData state");
  assert.equal(d.data[12], 1, "Upgrade authority is present");
  assert.equal(
    new PublicKey(d.data.subarray(13, 45)).toBase58(),
    expected.upgradeAuthority,
  );
  assert(c?.owner.equals(program), "Config owner");
  at("published IDL lookup");
  const idl = await Program.fetchIdl(program, { connection });
  assert.equal(idl?.address, expected.program, "Published IDL identity");
  at("local IDL file read");
  const local = JSON.parse(
    await readFile(
      process.argv[2] || "target/idl/trustlayer_escrow.json",
      "utf8",
    ),
  );
  at("published/local IDL equality");
  assert.equal(
    canonical(idl),
    canonical(local),
    "Complete published/local IDL equality",
  );
  at("Config decoding");
  const cfg = decodeConfig(idl, c.data, connection);
  at("Config values");
  assert.equal(cfg.usdcMint.toBase58(), expected.mint);
  assert.equal(cfg.feeRecipient.toBase58(), expected.treasury);
  assert.equal(cfg.arbitrationAuthority.toBase58(), expected.arbitrator);
  assert.equal(cfg.feeBps, 100);
  assert.equal(cfg.paused, false);
  at("USDC mint lookup and decimals");
  const mint = await getMint(
    connection,
    new PublicKey(expected.mint),
    "finalized",
    TOKEN_PROGRAM_ID,
  );
  assert.equal(mint.decimals, 6);
  console.log(
    JSON.stringify(
      {
        verified: true,
        cluster: "devnet",
        ...expected,
        feeBps: 100,
        paused: false,
        idlMatches: true,
      },
      null,
      2,
    ),
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    // Do not print exception messages/stacks: network errors can include credentials.
    const kind =
      error?.code === "ERR_ASSERTION"
        ? "expectation mismatch"
        : "operation failed";
    console.error(
      `Verification incomplete at ${stage}: ${kind}. No readiness asserted.`,
    );
    process.exitCode = 1;
  });
}
