import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { randomBytes } from "crypto";

// Run against a fresh local validator with [test].upgradeable = true.
describe("escrow security and lifecycle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TrustlayerEscrow;
  const connection = provider.connection;
  const payer = (provider.wallet as anchor.Wallet).payer;
  const buyer = payer;
  const seller = anchor.web3.Keypair.generate();
  const attacker = anchor.web3.Keypair.generate();
  const newAuthority = anchor.web3.Keypair.generate();
  const [config] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  );
  const [programData] = anchor.web3.PublicKey.findProgramAddressSync(
    [program.programId.toBuffer()],
    new anchor.web3.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
  );
  let mint: anchor.web3.PublicKey;
  let buyerToken: anchor.web3.PublicKey;
  let sellerToken: anchor.web3.PublicKey;
  let attackerToken: anchor.web3.PublicKey;
  const amount = new anchor.BN(1_000_000);
  const tokenProgram = new anchor.web3.PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );
  async function fails(task: Promise<unknown>) {
    let rejected = false;
    try {
      await task;
    } catch {
      rejected = true;
    }
    assert.isTrue(rejected, "unauthorized or invalid instruction must fail");
  }
  async function chainTime(): Promise<number> {
    const clock = await connection.getAccountInfo(
      anchor.web3.SYSVAR_CLOCK_PUBKEY,
      "confirmed",
    );
    if (!clock || clock.data.length < 40)
      throw new Error("Solana Clock sysvar unavailable");
    return Number(clock.data.readBigInt64LE(32));
  }
  async function waitPast(deadline: number) {
    // Wall time bounds the test, but only chain time establishes expiration.
    for (let attempt = 0; attempt < 120; attempt++) {
      if ((await chainTime()) > deadline) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error("Validator Clock did not advance past escrow deadline");
  }
  async function create(deadline?: number) {
    deadline ??= (await chainTime()) + 3600;
    const id = randomBytes(32);
    const [escrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), id],
      program.programId,
    );
    const [vaultAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), escrow.toBuffer()],
      program.programId,
    );
    const vault = anchor.web3.Keypair.generate();
    await program.methods
      .createEscrow(
        [...id],
        seller.publicKey,
        amount,
        [...randomBytes(32)],
        new anchor.BN(deadline),
      )
      .accountsStrict({
        config,
        escrow,
        vaultAuthority,
        vault: vault.publicKey,
        usdcMint: mint,
        buyer: buyer.publicKey,
        tokenProgram,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([vault])
      .rpc();
    return { escrow, vault: vault.publicKey, vaultAuthority };
  }
  function funding(row: Awaited<ReturnType<typeof create>>) {
    return {
      config,
      escrow: row.escrow,
      vault: row.vault,
      usdcMint: mint,
      buyer: buyer.publicKey,
      buyerTokenAccount: buyerToken,
      tokenProgram,
    };
  }
  function payout(row: Awaited<ReturnType<typeof create>>) {
    return {
      config,
      ...row,
      usdcMint: mint,
      sellerTokenAccount: sellerToken,
      feeTokenAccount: buyerToken,
      buyer: buyer.publicKey,
      tokenProgram,
    };
  }
  before(async () => {
    for (const key of [
      seller.publicKey,
      attacker.publicKey,
      newAuthority.publicKey,
    ])
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: key,
            lamports: 100_000_000,
          }),
        ),
      );
    mint = await createMint(connection, payer, payer.publicKey, null, 6);
    buyerToken = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        buyer.publicKey,
      )
    ).address;
    sellerToken = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        seller.publicKey,
      )
    ).address;
    attackerToken = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        attacker.publicKey,
      )
    ).address;
    await mintTo(connection, payer, mint, buyerToken, payer, 50_000_000);
  });
  it("rejects configuration front-running; only upgrade authority can initialize", async () => {
    const args = [mint, 100, buyer.publicKey, buyer.publicKey] as const;
    const accounts = {
      config,
      program: program.programId,
      programData,
      mint,
      authority: attacker.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    };
    await fails(
      program.methods
        .initializeConfig(...args)
        .accountsStrict(accounts)
        .signers([attacker])
        .rpc(),
    );
    await program.methods
      .initializeConfig(...args)
      .accountsStrict({ ...accounts, authority: buyer.publicKey })
      .rpc();
  });
  it("rejects redirected payouts, wrong fee recipients and vault substitution; pays exactly once", async () => {
    const row = await create();
    const other = await create();
    await program.methods.fundEscrow().accountsStrict(funding(row)).rpc();
    await fails(
      program.methods.fundEscrow().accountsStrict(funding(row)).rpc(),
    );
    await fails(
      program.methods
        .releaseToSeller()
        .accountsStrict({ ...payout(row), sellerTokenAccount: attackerToken })
        .rpc(),
    );
    await fails(
      program.methods
        .releaseToSeller()
        .accountsStrict({ ...payout(row), feeTokenAccount: attackerToken })
        .rpc(),
    );
    await fails(
      program.methods
        .releaseToSeller()
        .accountsStrict({ ...payout(row), vault: other.vault })
        .rpc(),
    );
    await fails(
      program.methods
        .releaseToSeller()
        .accountsStrict({ ...payout(row), buyer: attacker.publicKey })
        .signers([attacker])
        .rpc(),
    );
    const before = (await getAccount(connection, sellerToken)).amount;
    await program.methods
      .markDeliverySubmitted()
      .accountsStrict({ escrow: row.escrow, seller: seller.publicKey })
      .signers([seller])
      .rpc();
    await program.methods.releaseToSeller().accountsStrict(payout(row)).rpc();
    assert.equal(
      (await getAccount(connection, sellerToken)).amount - before,
      990_000n,
    );
    assert.equal((await getAccount(connection, row.vault)).amount, 0n);
    await fails(
      program.methods.releaseToSeller().accountsStrict(payout(row)).rpc(),
    );
  });
  it("blocks deposits during pause while preserving release and cancellation", async () => {
    const unfunded = await create();
    const funded = await create();
    await program.methods.fundEscrow().accountsStrict(funding(funded)).rpc();
    await fails(
      program.methods
        .setPaused(true)
        .accountsStrict({ config, authority: attacker.publicKey })
        .signers([attacker])
        .rpc(),
    );
    await program.methods
      .setPaused(true)
      .accountsStrict({ config, authority: buyer.publicKey })
      .rpc();
    await fails(
      program.methods.fundEscrow().accountsStrict(funding(unfunded)).rpc(),
    );
    await fails(create());
    await program.methods
      .releaseToSeller()
      .accountsStrict(payout(funded))
      .rpc();
    await program.methods
      .cancelUnfunded()
      .accountsStrict({ escrow: unfunded.escrow, authority: seller.publicKey })
      .signers([seller])
      .rpc();
    await program.methods
      .setPaused(false)
      .accountsStrict({ config, authority: buyer.publicKey })
      .rpc();
  });
  it("restricts dispute resolution signer and refund destination", async () => {
    const row = await create();
    await program.methods.fundEscrow().accountsStrict(funding(row)).rpc();
    await fails(
      program.methods
        .openDispute()
        .accountsStrict({ escrow: row.escrow, participant: seller.publicKey })
        .signers([seller])
        .rpc(),
    );
    await program.methods
      .openDispute()
      .accountsStrict({ escrow: row.escrow, participant: buyer.publicKey })
      .rpc();
    await fails(
      program.methods.releaseToSeller().accountsStrict(payout(row)).rpc(),
    );
    const accounts = {
      config,
      ...row,
      usdcMint: mint,
      buyerTokenAccount: buyerToken,
      arbitrationAuthority: buyer.publicKey,
      tokenProgram,
    };
    await fails(
      program.methods
        .resolveDisputeRefundBuyer()
        .accountsStrict({ ...accounts, buyerTokenAccount: attackerToken })
        .rpc(),
    );
    await fails(
      program.methods
        .resolveDisputeRefundBuyer()
        .accountsStrict({
          ...accounts,
          arbitrationAuthority: attacker.publicKey,
        })
        .signers([attacker])
        .rpc(),
    );
    const before = (await getAccount(connection, buyerToken)).amount;
    await program.methods
      .resolveDisputeRefundBuyer()
      .accountsStrict(accounts)
      .rpc();
    assert.equal(
      (await getAccount(connection, buyerToken)).amount - before,
      1_000_000n,
    );
    await fails(
      program.methods
        .resolveDisputeRefundBuyer()
        .accountsStrict(accounts)
        .rpc(),
    );
  });
  it("supports arbitrated seller payment without recipient substitution", async () => {
    const row = await create();
    await program.methods.fundEscrow().accountsStrict(funding(row)).rpc();
    await program.methods
      .openDispute()
      .accountsStrict({ escrow: row.escrow, participant: buyer.publicKey })
      .rpc();
    const { buyer: _buyer, ...base } = payout(row);
    const accounts = { ...base, arbitrationAuthority: buyer.publicKey };
    await fails(
      program.methods
        .resolveDisputePaySeller()
        .accountsStrict({ ...accounts, sellerTokenAccount: attackerToken })
        .rpc(),
    );
    await fails(
      program.methods
        .resolveDisputePaySeller()
        .accountsStrict({ ...accounts, feeTokenAccount: attackerToken })
        .rpc(),
    );
    await program.methods
      .resolveDisputePaySeller()
      .accountsStrict(accounts)
      .rpc();
    assert.equal((await getAccount(connection, row.vault)).amount, 0n);
  });
  it("allows seller escalation after deadline and rejects expired funding", async () => {
    const deadline = (await chainTime()) + 20;
    const row = await create(deadline);
    const expired = await create(deadline);
    await program.methods.fundEscrow().accountsStrict(funding(row)).rpc();
    await waitPast(deadline);
    await fails(
      program.methods.fundEscrow().accountsStrict(funding(expired)).rpc(),
    );
    await program.methods
      .openDispute()
      .accountsStrict({ escrow: row.escrow, participant: seller.publicKey })
      .signers([seller])
      .rpc();
  });
  it("requires both authority signatures for rotation and revokes old management authority", async () => {
    await fails(
      program.methods
        .rotateAuthorities(newAuthority.publicKey)
        .accountsStrict({
          config,
          authority: attacker.publicKey,
          newAuthority: newAuthority.publicKey,
        })
        .signers([attacker, newAuthority])
        .rpc(),
    );
    await program.methods
      .rotateAuthorities(newAuthority.publicKey)
      .accountsStrict({
        config,
        authority: buyer.publicKey,
        newAuthority: newAuthority.publicKey,
      })
      .signers([newAuthority])
      .rpc();
    await fails(
      program.methods
        .setPaused(true)
        .accountsStrict({ config, authority: buyer.publicKey })
        .rpc(),
    );
    await program.methods
      .setPaused(true)
      .accountsStrict({ config, authority: newAuthority.publicKey })
      .signers([newAuthority])
      .rpc();
  });
});
