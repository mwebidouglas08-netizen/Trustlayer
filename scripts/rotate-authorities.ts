import * as anchor from "@coral-xyz/anchor";
import { readFileSync } from "node:fs";
async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TrustlayerEscrow;
  const path = process.env.NEW_AUTHORITY_KEYPAIR;
  if (!path)
    throw new Error(
      "NEW_AUTHORITY_KEYPAIR must be a secured local keypair path",
    );
  const newAuthority = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))),
  );
  const arbitrator = new anchor.web3.PublicKey(
    process.env.ARBITRATION_AUTHORITY!,
  );
  const [config] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  );
  console.log(
    await program.methods
      .rotateAuthorities(arbitrator)
      .accountsStrict({
        config,
        authority: provider.publicKey,
        newAuthority: newAuthority.publicKey,
      })
      .signers([newAuthority])
      .rpc(),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
