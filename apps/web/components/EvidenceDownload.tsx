"use client";
import { useState, useEffect, useRef } from "react";
import { backend } from "@/lib/supabase/client";
import { useAccount } from "./AccountProvider";
import { FileExport } from "./FileExport";
import type { AgreementFile } from "@/lib/workspace";
export function EvidenceDownload({ file }: { file: AgreementFile }) {
  const { session } = useAccount();
  const generation = useRef(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const invalidate = () => {
      generation.current += 1;
    };
    invalidate();
    setBlob(null);
    setBusy(false);
    return invalidate;
  }, [session?.user.id, file.storage_path]);
  return (
    <div>
      <button
        type="button"
        className="btn secondary"
        disabled={busy || !session}
        onClick={async () => {
          const current = ++generation.current;
          setBusy(true);
          setError("");
          setBlob(null);
          try {
            const { data, error } = await backend()
              .storage.from("trustlayer-evidence")
              .download(file.storage_path);
            if (error) throw error;
            if (!data || data.size !== file.byte_size)
              throw new Error(
                "File size does not match its record. Download stopped.",
              );
            if (current === generation.current) setBlob(data);
          } catch {
            if (current === generation.current)
              setError(
                "Unable to load this private file. Check your sign-in and agreement access, then retry.",
              );
          } finally {
            if (current === generation.current) setBusy(false);
          }
        }}
      >
        {busy ? "Loading private file…" : "Prepare download"}
      </button>
      {blob && session && (
        <FileExport name={file.filename} data={blob} label="Download file" />
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
