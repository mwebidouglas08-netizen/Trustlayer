"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  availableWallets,
  BrowserWallet,
  deploymentIssue,
  Escrow,
  EscrowClient,
} from "@/lib/escrow";
import { explorer } from "@/lib/solana/cluster";

type Notice = {
  id: number;
  message: string;
  signature?: string;
  error?: boolean;
};
type DappContext = {
  address: string | null;
  client: EscrowClient | null;
  escrows: Escrow[];
  balance: { sol: number; usdc: string } | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  notices: Notice[];
  issue: string | null;
  connect: (name?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  run: <T>(task: () => Promise<T>, success: string) => Promise<T | undefined>;
  notify: (message: string, signature?: string) => void;
};
const Context = createContext<DappContext | null>(null);
export function useDapp() {
  const value = useContext(Context);
  if (!value) throw new Error("Dapp provider missing");
  return value;
}
export function DappProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [client, setClient] = useState<EscrowClient | null>(null);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [balance, setBalance] = useState<{ sol: number; usdc: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const generation = useRef(0);
  const lock = useRef(false);
  const issue = deploymentIssue();
  const notify = useCallback(
    (message: string, signature?: string) =>
      setNotices((old) =>
        [{ id: Date.now(), message, signature }, ...old].slice(0, 30),
      ),
    [],
  );
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    if (!wallet?.publicKey || issue) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await EscrowClient.connect(wallet);
      const [rows, funds] = await Promise.all([next.list(), next.balances()]);
      if (generation.current === current) {
        setClient(next);
        setEscrows(rows);
        setBalance(funds);
      }
    } catch (e) {
      if (generation.current === current) {
        setClient(null);
        setEscrows([]);
        setBalance(null);
        setError(
          e instanceof Error ? e.message : "Could not load on-chain data.",
        );
      }
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, [wallet, issue]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!wallet) return;
    const changed = () => {
      ++generation.current;
      setClient(null);
      setEscrows([]);
      setBalance(null);
      setNotices([]);
      setAddress(wallet.publicKey?.toBase58() || null);
      if (!wallet.publicKey) {
        setWallet(null);
        setLoading(false);
      } else void refresh();
    };
    wallet.on?.("accountChanged", changed);
    wallet.on?.("disconnect", changed);
    return () => {
      wallet.removeListener?.("accountChanged", changed);
      wallet.removeListener?.("disconnect", changed);
    };
  }, [wallet, refresh]);
  async function connect(name?: string) {
    setError(null);
    try {
      const options = availableWallets();
      const selected = (
        name ? options.find((w) => w.name === name) : options[0]
      )?.wallet;
      if (!selected)
        throw new Error(
          "Install Phantom or Solflare, or open this app in your wallet’s browser. Never enter a seed phrase here.",
        );
      const result = await selected.connect();
      setAddress(result.publicKey.toBase58());
      setWallet(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection declined.");
    }
  }
  async function disconnect() {
    ++generation.current;
    const previous = wallet;
    setWallet(null);
    setAddress(null);
    setClient(null);
    setEscrows([]);
    setBalance(null);
    setError(null);
    setNotices([]);
    try {
      await previous?.disconnect();
    } catch {
      /* Local connection is already cleared. */
    }
  }
  async function run<T>(task: () => Promise<T>, success: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await task();
      notify(success, typeof result === "string" ? result : undefined);
      await refresh();
      return result;
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "The transaction could not be completed.";
      setError(message);
      setNotices((old) =>
        [{ id: Date.now(), message, error: true }, ...old].slice(0, 30),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        address,
        client,
        escrows,
        balance,
        loading,
        busy,
        error,
        notices,
        issue,
        connect,
        disconnect,
        refresh,
        run,
        notify,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function ConnectionGate() {
  const { address, connect, issue, loading, client } = useDapp();
  if (client) return null;
  return (
    <div className="empty-state">
      <span className="empty-icon">◎</span>
      <h2>
        {loading
          ? "Reading the blockchain…"
          : address
            ? "Deployment setup required"
            : "Your wallet. Your workspace."}
      </h2>
      <p>
        {loading
          ? "Fetching your escrows and token balances from Solana."
          : address
            ? issue ||
              "The program could not be loaded. Check the error above and retry."
            : "Connect Phantom or Solflare to view your real escrows. Connecting is free and does not authorize any payment."}
      </p>
      {!address && (
        <button className="btn primary" onClick={() => void connect()}>
          Connect wallet <span>↗</span>
        </button>
      )}
    </div>
  );
}
export function Receipt({ signature }: { signature: string }) {
  return (
    <a
      className="text-link"
      href={explorer(signature, "tx")}
      target="_blank"
      rel="noreferrer"
    >
      View confirmed transaction ↗
    </a>
  );
}
