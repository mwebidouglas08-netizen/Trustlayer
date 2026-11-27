import chromium from "@sparticuz/chromium";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve("@sparticuz/chromium"));
// The sandbox has no system NSS. Use the libraries shipped with the npm browser.
const { inflate } = require(resolve(packageDir, "lambdafs.cjs"));
await inflate(resolve(packageDir, "../../bin/al2023.tar.br"));
const executablePath = await chromium.executablePath();
const result = spawnSync(
  process.execPath,
  ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CHROMIUM_PATH: executablePath,
      LD_LIBRARY_PATH: `${tmpdir()}/al2023/lib:${process.env.LD_LIBRARY_PATH || ""}`,
    },
  },
);
process.exitCode = result.status ?? 1;
