"use client";
import { useState } from "react";
import { downloadBlob, jsonExport, safeFilename } from "@/lib/download";

export function FileExport({
  name,
  data,
  label = "Download",
  onRequested,
}: {
  name: string;
  data: string | Blob;
  label?: string;
  onRequested?: () => void;
}) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const blob = () => (typeof data === "string" ? jsonExport(data) : data);
  return (
    <div className="file-export">
      <div className="button-row">
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            try {
              downloadBlob(name, blob());
              onRequested?.();
              setNotice(
                "Download requested. Check Downloads/Files before continuing. If nothing appears, try Share / Save.",
              );
            } catch {
              setNotice(
                "This browser blocked the download. Try Share / Save or open this page in Safari or Chrome.",
              );
            }
          }}
        >
          {label}
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={busy}
          onClick={async () => {
            const file = new File([blob()], safeFilename(name), {
              type: blob().type,
            });
            if (!navigator.canShare?.({ files: [file] })) {
              setNotice(
                "File sharing is not supported here. Use Download, or open this page in Safari or Chrome and sign in again.",
              );
              return;
            }
            setBusy(true);
            try {
              await navigator.share({ files: [file] });
              onRequested?.();
              setNotice(
                "Share sheet completed. Confirm the file was saved in your chosen destination.",
              );
            } catch (error) {
              setNotice(
                error instanceof Error && error.name === "AbortError"
                  ? "Sharing cancelled. No save confirmed."
                  : "Unable to share this file. Try Download.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Sharing…" : "Share / Save"}
        </button>
      </div>
      {notice && (
        <p role="status" className="muted">
          {notice}
        </p>
      )}
    </div>
  );
}
