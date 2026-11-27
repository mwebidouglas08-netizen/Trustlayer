import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export function validateSqlEncoding(bytes, name) {
  // PostgreSQL/Supabase migration parsing does not strip a UTF-8 BOM.
  if (bytes.includes(Buffer.from([0xef, 0xbb, 0xbf]))) {
    throw new Error(`${name}: unexpected UTF-8 BOM; save as UTF-8 without BOM`);
  }
  new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (bytes.includes(0)) throw new Error(`${name}: unexpected NUL byte`);
}

async function checkDirectory(directory) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) count += await checkDirectory(path);
    else if (entry.isFile() && entry.name.endsWith(".sql")) {
      validateSqlEncoding(await readFile(path), path);
      count++;
    }
  }
  return count;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  checkDirectory(fileURLToPath(new URL("../supabase/", import.meta.url)))
    .then((count) => console.log(`SQL encoding: ${count} files passed`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
