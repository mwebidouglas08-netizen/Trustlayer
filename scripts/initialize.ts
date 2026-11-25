import * as anchor from "@coral-xyz/anchor";
// Operator only. Uses ANCHOR_PROVIDER_URL and ANCHOR_WALLET; never a browser secret.
async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TrustlayerEscrow;
  const mint = new anchor.web3.PublicKey(process.env.USDC_MINT!);
  const feeRecipient = new anchor.web3.PublicKey(process.env.FEE_RECIPIENT!);
  const arbitrationAuthority = new anchor.web3.PublicKey(
    process.env.ARBITRATION_AUTHORITY!,
  );
  const feeBps = Number(process.env.FEE_BPS || "0");
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 100)
    throw new Error("FEE_BPS must be an integer from 0 to 100");
  const [config] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  );
  const [programData] = anchor.web3.PublicKey.findProgramAddressSync(
    [program.programId.toBuffer()],
    new anchor.web3.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
  );
  console.log(
    await program.methods
      .initializeConfig(mint, feeBps, feeRecipient, arbitrationAuthority)
      .accountsStrict({
        config,
        program: program.programId,
        programData,
        mint,
        authority: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc(),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
