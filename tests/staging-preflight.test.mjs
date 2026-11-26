import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, unlink, writeFile, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("staging preflight checks isolation without logging credential values", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cre-alexa-staging-"));
  const envFile = join(dir, "staging.env");
  const run = () => spawnSync(process.execPath, ["scripts/staging-preflight.mjs", envFile], { encoding: "utf8" });
  const fixture = [
    "COMMUNITY_SUPABASE_URL=https://db.example.invalid",
    "COMMUNITY_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture",
    "COMMUNITY_SUPABASE_SERVICE_ROLE_KEY=sb_secret_fixture",
    "COMMUNITY_ORIGIN=http://127.0.0.1:4323",
    "COMMUNITY_STRIPE_SECRET_KEY=sk_test_fixture",
    "COMMUNITY_STRIPE_WEBHOOK_SECRET=whsec_fixture",
    "COMMUNITY_VENDOR_PRICE_ID=price_fixture",
  ].join("\n");
  try {
    await writeFile(envFile, fixture);
    assert.equal(run().status, 0);
    await writeFile(envFile, fixture.replace("sk_test_fixture", "sk_live_fixture")
      .replace("http://127.0.0.1:4323", "https://cre-alexa-carloten80ten-090d.wix-site-host.com"));
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /separate HTTPS staging origin/);
    assert.match(result.stderr, /Stripe test key/);
    assert.doesNotMatch(result.stdout + result.stderr, /sk_live_fixture|whsec_fixture|sb_secret_fixture/);
  } finally {
    await unlink(envFile);
    await rmdir(dir);
  }
});
