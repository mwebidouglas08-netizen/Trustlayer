import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function configureLocalnet(source, config, address) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))
    throw new Error("Invalid public program address");
  const declaration = /declare_id!\("[1-9A-HJ-NP-Za-km-z]+"\);/g;
  if ([...source.matchAll(declaration)].length !== 1)
    throw new Error("Expected exactly one program declaration");
  const section = /(^\[programs\.localnet\]\s*\n)([^\[]*)/m;
  const match = config.match(section);
  if (!match) throw new Error("Missing localnet configuration");
  const entry = /^trustlayer_escrow\s*=\s*"[1-9A-HJ-NP-Za-km-z]+"/gm;
  if ([...match[2].matchAll(entry)].length !== 1)
    throw new Error("Expected exactly one localnet program entry");
  return {
    source: source.replace(declaration, `declare_id!("${address}");`),
    config: config.replace(
      section,
      (_, header, body) =>
        header + body.replace(entry, `trustlayer_escrow = "${address}"`),
    ),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.env.GITHUB_ACTIONS !== "true")
    throw new Error(
      "Disposable GitHub runner only; do not run in a development checkout",
    );
  const sourcePath = "programs/trustlayer_escrow/src/lib.rs";
  const configPath = "Anchor.toml";
  // Only solana-keygen reads the runner-generated keypair; stdout is a public address.
  const address = execFileSync(
    "solana-keygen",
    ["pubkey", "target/deploy/trustlayer_escrow-keypair.json"],
    { encoding: "utf8" },
  ).trim();
  const source = readFileSync(sourcePath, "utf8");
  const config = readFileSync(configPath, "utf8");
  const updated = configureLocalnet(source, config, address);
  if (process.argv[2] === "--verify") {
    const idl = JSON.parse(
      readFileSync("target/idl/trustlayer_escrow.json", "utf8"),
    );
    if (
      source !== updated.source ||
      config !== updated.config ||
      idl.address !== address
    )
      throw new Error(
        "Source, Localnet configuration, IDL and runner public key must agree",
      );
    console.log(`Verified disposable Localnet identity: ${address}`);
  } else if (process.argv[2] === "--configure") {
    writeFileSync(sourcePath, updated.source);
    writeFileSync(configPath, updated.config);
    console.log(`Configured disposable Localnet identity: ${address}`);
  } else throw new Error("Expected --configure or --verify");
}
