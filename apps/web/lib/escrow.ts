import { AnchorProvider, BN, Idl, Program, utils } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  SendTransactionError,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Buffer } from "buffer";
import { decodeClockTimestamp, assertFutureDeadline } from "./solana/clock";
import { Action, agreementText, parseAmount } from "./protocol";
import { getSolanaCluster, assertRpcCluster } from "./solana/cluster";

export interface BrowserWallet {
  signMessage?(
    message: Uint8Array,
    encoding?: string,
  ): Promise<Uint8Array | { signature: Uint8Array }>;
  publicKey: PublicKey | null;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]>;
  on?(event: string, listener: () => void): void;
  removeListener?(event: string, listener: () => void): void;
}
export function availableWallets(): { name: string; wallet: BrowserWallet }[] {
  const w = window as unknown as {
    phantom?: { solana?: BrowserWallet };
    solflare?: BrowserWallet;
  };
  return [
    { name: "Phantom", wallet: w.phantom?.solana },
    { name: "Solflare", wallet: w.solflare },
  ].filter((v): v is { name: string; wallet: BrowserWallet } => !!v.wallet);
}
export type Escrow = {
  address: string;
  buyer: string;
  seller: string;
  mint: string;
  vault: string;
  amount: string;
  feeBps: number;
  feeRecipient: string;
  deadline: number;
  state: number;
  hash: string;
  fundedAt: number;
  settledAt: number;
  disputedAt: number;
};
interface RawEscrow {
  escrowId: number[];
  version: number;
  buyer: PublicKey;
  seller: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  amount: BN;
  feeBps: number;
  feeRecipient: PublicKey;
  deadlineUnix: BN;
  state: number;
  agreementHash: number[];
  fundedAtUnix: BN;
  settledAtUnix: BN;
  disputedAtUnix: BN;
}
export interface Config {
  authority: PublicKey;
  usdcMint: PublicKey;
  feeBps: number;
  feeRecipient: PublicKey;
  arbitrationAuthority: PublicKey;
  paused: boolean;
}
function decode(address: PublicKey, raw: RawEscrow): Escrow {
  return {
    address: address.toBase58(),
    buyer: raw.buyer.toBase58(),
    seller: raw.seller.toBase58(),
    mint: raw.mint.toBase58(),
    vault: raw.vault.toBase58(),
    amount: raw.amount.toString(),
    feeBps: raw.feeBps,
    feeRecipient: raw.feeRecipient.toBase58(),
    deadline: raw.deadlineUnix.toNumber(),
    state: raw.state,
    hash: Buffer.from(raw.agreementHash).toString("hex"),
    fundedAt: raw.fundedAtUnix.toNumber(),
    settledAt: raw.settledAtUnix.toNumber(),
    disputedAt: raw.disputedAtUnix.toNumber(),
  };
}
export function deploymentIssue(): string | null {
  const id = process.env.NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID;
  if (!id || id === "TRusT11111111111111111111111111111111111111")
    return "The escrow program has not been configured. A deployment operator must deploy the program, publish its IDL, and initialize its configuration before transactions are available.";
  try {
    new PublicKey(id);
    new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || "");
    if (getSolanaCluster() === "mainnet-beta")
      return "Mainnet payments are disabled in this unaudited release. Use devnet for validation.";
  } catch {
    return "Program, token mint, or network configuration is invalid.";
  }
  return null;
}
interface EscrowAccounts {
  config: { fetch(address: PublicKey): Promise<Config> };
  escrow: {
    fetch(address: PublicKey): Promise<RawEscrow>;
    all(
      filters: { memcmp: { offset: number; bytes: string } }[],
    ): Promise<{ publicKey: PublicKey; account: RawEscrow }[]>;
  };
}
function accounts(program: Program<Idl>): EscrowAccounts {
  return program.account as unknown as EscrowAccounts;
}
export class EscrowClient {
  private constructor(
    public program: Program<Idl>,
    public provider: AnchorProvider,
    public config: Config,
    public configAddress: PublicKey,
  ) {}
  static async connect(wallet: BrowserWallet): Promise<EscrowClient> {
    const issue = deploymentIssue();
    if (issue) throw new Error(issue);
    if (!wallet.publicKey) throw new Error("Connect a wallet first.");
    const connection = new Connection(
      `${window.location.origin}/api/rpc`,
      "confirmed",
    );
    const genesis = await connection.getGenesisHash();
    const cluster = getSolanaCluster();

    assertRpcCluster(cluster, genesis);
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: wallet.signAllTransactions.bind(wallet),
      },
      { commitment: "confirmed" },
    );
    const id = new PublicKey(process.env.NEXT_PUBLIC_TRUSTLAYER_PROGRAM_ID!);
    const deployed = await connection.getAccountInfo(id, "confirmed");
    if (
      !deployed?.executable ||
      !deployed.owner.equals(
        new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
      )
    )
      throw new Error(
        "Configured escrow program is not an executable upgradeable deployment.",
      );
    const idl = await Program.fetchIdl(id, provider);
    if (!idl || idl.address !== id.toBase58())
      throw new Error(
        "Published program IDL is missing or does not match the configured program.",
      );
    const program = new Program(idl, provider);
    if (
      [
        "initializeConfig",
        "setPaused",
        "rotateAuthorities",
        "createEscrow",
        "fundEscrow",
        "markDeliverySubmitted",
        "releaseToSeller",
        "openDispute",
        "resolveDisputeRefundBuyer",
        "resolveDisputePaySeller",
        "cancelUnfunded",
      ].some((name) => !program.methods[name])
    )
      throw new Error(
        "Deployment is running an incompatible escrow version. Upgrade the program and publish the current IDL.",
      );
    const [address] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      id,
    );
    const configInfo = await connection.getAccountInfo(address, "confirmed");
    if (!configInfo?.owner.equals(id))
      throw new Error(
        "Configuration account has the wrong owner or has not been initialized.",
      );
    const config = program.coder.accounts.decode<Config>(
      "config",
      configInfo.data,
    );
    if (config.usdcMint.toBase58() !== process.env.NEXT_PUBLIC_USDC_MINT)
      throw new Error(
        "Configured token mint differs from the on-chain mint. Signing is disabled.",
      );
    const mint = await getMint(
      connection,
      config.usdcMint,
      "confirmed",
      TOKEN_PROGRAM_ID,
    );
    if (mint.decimals !== 6 || config.feeBps > 100)
      throw new Error("Unsupported token decimals or fee configuration.");
    return new EscrowClient(program, provider, config, address);
  }
  async list(): Promise<Escrow[]> {
    const wallet = this.provider.publicKey.toBase58();
    // Discriminator (8), version (1), escrow ID (32): buyer at 41, seller at 73.
    const [bought, sold] = await Promise.all(
      [41, 73].map((offset) =>
        accounts(this.program).escrow.all([
          { memcmp: { offset, bytes: wallet } },
        ]),
      ),
    );
    return [
      ...new Map(
        [...bought, ...sold].map((row) => [
          row.publicKey.toBase58(),
          decode(row.publicKey, row.account as unknown as RawEscrow),
        ]),
      ).values(),
    ].sort((a, b) => b.deadline - a.deadline);
  }
  async fetch(address: string): Promise<Escrow> {
    const key = new PublicKey(address);
    const info = await this.provider.connection.getAccountInfo(
      key,
      "confirmed",
    );
    if (!info?.owner.equals(this.program.programId))
      throw new Error("Escrow account is not owned by the configured program.");
    const raw = this.program.coder.accounts.decode<RawEscrow>(
      "escrow",
      info.data,
    );
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(raw.escrowId)],
      this.program.programId,
    );
    if (
      !key.equals(expected) ||
      raw.version !== 1 ||
      !raw.mint.equals(this.config.usdcMint)
    )
      throw new Error(
        "Escrow identity, version or mint does not match this deployment.",
      );
    return decode(key, raw);
  }
  async chainTime(): Promise<number> {
    const clock = await this.provider.connection.getAccountInfo(
      SYSVAR_CLOCK_PUBKEY,
      "confirmed",
    );
    if (!clock)
      throw new Error(
        "Unable to read Solana Clock. Signing is disabled until RPC recovers.",
      );
    return decodeClockTimestamp(clock.data);
  }
  async balances() {
    const [sol, tokens] = await Promise.all([
      this.provider.connection.getBalance(this.provider.publicKey),
      this.provider.connection.getParsedTokenAccountsByOwner(
        this.provider.publicKey,
        { mint: this.config.usdcMint },
      ),
    ]);
    return {
      sol: sol / 1e9,
      usdc: tokens.value
        .reduce(
          (n, row) =>
            n + BigInt(row.account.data.parsed.info.tokenAmount.amount),
          0n,
        )
        .toString(),
    };
  }
  async create(
    sellerAddress: string,
    amountInput: string,
    deadline: number,
    terms: string,
  ) {
    const seller = new PublicKey(sellerAddress);
    if (
      !PublicKey.isOnCurve(seller.toBytes()) ||
      seller.equals(this.provider.publicKey)
    )
      throw new Error("Use a different, valid seller wallet address.");
    if (!terms.trim() || terms.length > 10000)
      throw new Error("Agreement terms must contain 1–10,000 characters.");
    assertFutureDeadline(deadline, await this.chainTime());
    const amount = parseAmount(amountInput);
    const agreement = agreementText(
      sellerAddress,
      amount.toString(),
      deadline,
      terms,
    );
    const hash = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(agreement),
      ),
    );
    const id = crypto.getRandomValues(new Uint8Array(32));
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), id],
      this.program.programId,
    );
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), escrow.toBuffer()],
      this.program.programId,
    );
    const vault = Keypair.generate();
    const ix = await this.program.methods
      .createEscrow(
        [...id],
        seller,
        new BN(amount.toString()),
        [...hash],
        new BN(deadline),
      )
      .accountsStrict({
        config: this.configAddress,
        escrow,
        vaultAuthority,
        vault: vault.publicKey,
        usdcMint: this.config.usdcMint,
        buyer: this.provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();
    // Persist terms BEFORE broadcast so a confirmation timeout cannot lose the only local copy.
    // The review UI also requires a file download; local storage may be unavailable.
    try {
      localStorage.setItem(
        `trustlayer:${getSolanaCluster()}:${escrow.toBase58()}`,
        agreement,
      );
    } catch {
      /* Download is the durable backup. */
    }
    const signature = await this.send(
      new Transaction().add(ix),
      [vault],
      async () => {
        assertFutureDeadline(deadline, await this.chainTime());
      },
    );
    return { signature, address: escrow.toBase58(), agreement };
  }
  async act(action: Action, escrow: Escrow) {
    // Never authorize funding from a stale page or the device wall clock.
    escrow = await this.fetch(escrow.address);
    const checkFunding = async () => {
      if (action !== "fundEscrow") return;
      const fresh = await this.fetch(escrow.address);
      if (fresh.state !== 0)
        throw new Error(
          "This escrow is no longer unfunded. Refresh its on-chain state; do not repeat payment.",
        );
      assertFutureDeadline(fresh.deadline, await this.chainTime());
    };
    await checkFunding();
    const key = new PublicKey(escrow.address);
    const common = {
      config: this.configAddress,
      escrow: key,
      usdcMint: new PublicKey(escrow.mint),
      tokenProgram: TOKEN_PROGRAM_ID,
      vault: new PublicKey(escrow.vault),
    };
    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), key.toBuffer()],
      this.program.programId,
    );
    const tx = new Transaction();
    const ata = (owner: string) => {
      const ownerKey = new PublicKey(owner);
      const address = getAssociatedTokenAddressSync(
        common.usdcMint,
        ownerKey,
        true,
      );
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          this.provider.publicKey,
          address,
          ownerKey,
          common.usdcMint,
        ),
      );
      return address;
    };
    let accounts: Record<string, PublicKey>;
    if (action === "fundEscrow")
      accounts = {
        ...common,
        buyer: this.provider.publicKey,
        buyerTokenAccount: ata(escrow.buyer),
      };
    else if (
      action === "releaseToSeller" ||
      action === "resolveDisputePaySeller"
    )
      accounts = {
        ...common,
        vaultAuthority,
        sellerTokenAccount: ata(escrow.seller),
        feeTokenAccount: ata(escrow.feeRecipient),
        [action === "releaseToSeller" ? "buyer" : "arbitrationAuthority"]:
          this.provider.publicKey,
      };
    else if (action === "resolveDisputeRefundBuyer")
      accounts = {
        ...common,
        vaultAuthority,
        buyerTokenAccount: ata(escrow.buyer),
        arbitrationAuthority: this.provider.publicKey,
      };
    else
      accounts = {
        escrow: key,
        [action === "openDispute"
          ? "participant"
          : action === "markDeliverySubmitted"
            ? "seller"
            : "authority"]: this.provider.publicKey,
      };
    tx.add(
      await this.program.methods[action]()
        .accountsStrict(accounts)
        .instruction(),
    );
    return this.send(tx, [], checkFunding);
  }
  async pause(paused: boolean) {
    const ix = await this.program.methods
      .setPaused(paused)
      .accountsStrict({
        config: this.configAddress,
        authority: this.provider.publicKey,
      })
      .instruction();
    return this.send(new Transaction().add(ix));
  }
  private async send(
    tx: Transaction,
    signers: Keypair[] = [],
    beforeSubmit?: () => Promise<void>,
  ) {
    const latest =
      await this.provider.connection.getLatestBlockhash("confirmed");
    tx.feePayer = this.provider.publicKey;
    tx.recentBlockhash = latest.blockhash;
    if (signers.length) tx.partialSign(...signers);
    const signed = await this.provider.wallet.signTransaction(tx);
    if (!signed.signature)
      throw new Error("Wallet did not supply the required signature.");
    // Recheck after a potentially long wallet approval, before any submission.
    await beforeSubmit?.();
    const signature = utils.bytes.bs58.encode(signed.signature);
    try {
      await this.provider.connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      // HTTP polling avoids exposing a credentialed RPC URL through a websocket endpoint.
      const until = Date.now() + 90000;
      while (Date.now() < until) {
        const result = (
          await this.provider.connection.getSignatureStatuses([signature], {
            searchTransactionHistory: true,
          })
        ).value[0];
        if (result?.err)
          throw new Error(
            `On-chain transaction failed: ${JSON.stringify(result.err)}`,
          );
        if (
          result?.confirmationStatus === "confirmed" ||
          result?.confirmationStatus === "finalized"
        )
          return signature;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      throw new Error("Confirmation timed out");
    } catch (error) {
      if (
        error instanceof SendTransactionError &&
        error.message.startsWith("Simulation failed.")
      ) {
        const logs = error.transactionError.logs || [];
        if (logs.some((line) => line.includes("Error Code: InvalidDeadline")))
          throw new Error(
            "RPC preflight rejected funding because the on-chain deadline expired. This submission was not broadcast by the RPC. Cancel the unfunded escrow and agree a new future deadline; do not retry funding this escrow.",
          );
        throw new Error(
          `RPC preflight rejected this submission; it was not broadcast by the RPC. ${error.transactionError.message}`,
        );
      }
      throw new Error(
        `${error instanceof Error ? error.message : "Confirmation unavailable"}. Signed transaction ${signature} may have been submitted. Check the explorer before retrying; do not assume a transport error means failure.`,
      );
    }
  }
}
