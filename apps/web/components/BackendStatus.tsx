"use client";
import { useCallback, useEffect, useState } from "react";
import { Database, RefreshCw, ShieldCheck } from "lucide-react";
import { BACKEND } from "@/lib/supabase/deployment";
export function BackendStatus() {
  const [status, setStatus] = useState<{
    databaseReady: boolean;
    privateStorageReady: boolean;
    checkedAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const check = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${BACKEND.url}/functions/v1/trustlayer-health`,
        { cache: "no-store", signal: AbortSignal.timeout(10000) },
      );
      const data = await response.json();
      if (
        !response.ok ||
        typeof data.databaseReady !== "boolean" ||
        typeof data.privateStorageReady !== "boolean"
      )
        throw new Error("Backend readiness could not be verified.");
      setStatus(data);
    } catch {
      setStatus(null);
      setError("Status unavailable. Retry or check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void check();
  }, [check]);
  return (
    <section className="backend-status panel">
      <div className="backend-status-intro">
        <Database size={21} />
        <div>
          <strong>Connected workspace</strong>
          <p>
            {loading
              ? "Checking the deployed backend…"
              : error ||
                (status?.checkedAt
                  ? `Last checked ${new Date(status.checkedAt).toLocaleTimeString()}`
                  : "Backend readiness not yet verified.")}
          </p>
        </div>
      </div>
      <div className="service-checks">
        <span className={status?.databaseReady ? "ready" : ""}>
          <i />
          Database {status?.databaseReady ? "ready" : "unverified"}
        </span>
        <span className={status?.privateStorageReady ? "ready" : ""}>
          <ShieldCheck size={13} />
          Private storage {status?.privateStorageReady ? "ready" : "unverified"}
        </span>
        <span className="payment-gate">
          <i />
          Payments not activated
        </span>
      </div>
      <button
        className="icon-btn"
        onClick={() => void check()}
        disabled={loading}
        aria-label="Check backend health"
      >
        <RefreshCw size={16} />
      </button>
    </section>
  );
}
