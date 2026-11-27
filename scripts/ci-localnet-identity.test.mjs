import { test } from "node:test";
import assert from "node:assert/strict";
import { configureLocalnet } from "./ci-localnet-identity.mjs";

const deployed = "7v6PxWejvNneG5TwZSntgj5ZjV6sgLSengjkVsct6V2G";
const ephemeral = "11111111111111111111111111111111";
const source = `declare_id!("${deployed}");\n`;
const devnet = `[programs.devnet]\ntrustlayer_escrow = "${deployed}"\n\n`;
const localnet = `[programs.localnet]\ntrustlayer_escrow = "${deployed}"\n\n`;
const provider = '[provider]\ncluster = "Localnet"\n';

test("sets source and Localnet together, preserving Devnet in either section order", () => {
  for (const config of [
    devnet + localnet + provider,
    localnet + devnet + provider,
  ]) {
    const result = configureLocalnet(source, config, ephemeral);
    assert.equal(result.source, `declare_id!("${ephemeral}");\n`);
    assert.ok(result.config.includes(devnet));
    assert.ok(
      result.config.includes(
        `[programs.localnet]\ntrustlayer_escrow = "${ephemeral}"`,
      ),
    );
    assert.ok(result.config.endsWith(provider));
    assert.deepEqual(
      configureLocalnet(result.source, result.config, ephemeral),
      result,
    );
  }
});
test("rejects missing or ambiguous declarations and invalid addresses", () => {
  for (const args of [
    [source, devnet, ephemeral],
    [source + source, localnet, ephemeral],
    [source, localnet, "not-an-address"],
  ])
    assert.throws(() => configureLocalnet(...args));
});
