export interface Agreement {
  id: string;
  creator_id: string;
  seller_wallet: string;
  title: string;
  amount_text: string;
  deadline: string;
  terms: string;
  status: "draft" | "proposed" | "accepted" | "cancelled";
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface AgreementFile {
  id: string;
  storage_path: string;
  filename: string;
  byte_size: number;
  uploaded_by: string;
  created_at: string;
}
export interface AgreementEvent {
  id: string;
  agreement_id: string;
  action: string;
  created_at: string;
}
export const AGREEMENT_FIELDS =
  "id,creator_id,seller_wallet,title,amount_text,deadline,terms,status,accepted_by,accepted_at,created_at,updated_at";
export const FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
];
export function validateEvidence(file: {
  size: number;
  type: string;
  name: string;
}) {
  if (file.size <= 0 || file.size > 10 * 1024 * 1024)
    throw new Error("Choose a non-empty file no larger than 10 MB.");
  if (!FILE_TYPES.includes(file.type))
    throw new Error("Only PDF, PNG, JPEG and plain text files are accepted.");
  if (file.name.length > 180)
    throw new Error("Shorten the filename to 180 characters or fewer.");
}
export function normalizeSignature(value: unknown): Uint8Array {
  // Wallet extensions can return typed arrays from another browser realm.
  const bytes = ArrayBuffer.isView(value)
    ? value
    : value && typeof value === "object" && "signature" in value
      ? value.signature
      : null;
  if (
    !ArrayBuffer.isView(bytes) ||
    Object.prototype.toString.call(bytes) !== "[object Uint8Array]" ||
    bytes.byteLength !== 64
  )
    throw new Error("Wallet returned an invalid Ed25519 signature.");
  if (bytes instanceof Uint8Array) return bytes;
  return new Uint8Array(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).slice();
}
