export function safeFilename(name: string): string {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|\u202a-\u202e\u2066-\u2069]/g, "_")
    .replace(/^\.+/, "")
    .trim();
  return cleaned.slice(0, 180) || "trustlayer-export";
}

/** Preserve exact bytes: escrow agreement hashes depend on the original JSON. */
export function jsonExport(text: string): Blob {
  return new Blob([text], { type: "application/json;charset=utf-8" });
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename(name);
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  try {
    link.click();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    link.remove();
  }
  // Safari/wallet webviews may consume the URL after the click task finishes.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
