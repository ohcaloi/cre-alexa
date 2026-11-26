import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const path = process.argv[2] ?? ".env.staging.local";
let env;
try {
  env = parseEnv(readFileSync(path, "utf8"));
} catch {
  console.error(`Create the ignored staging configuration ${path} from .env.example.`);
  process.exit(1);
}

const required = [
  "COMMUNITY_SUPABASE_URL", "COMMUNITY_SUPABASE_PUBLISHABLE_KEY", "COMMUNITY_SUPABASE_SERVICE_ROLE_KEY",
  "COMMUNITY_ORIGIN", "COMMUNITY_STRIPE_SECRET_KEY", "COMMUNITY_STRIPE_WEBHOOK_SECRET", "COMMUNITY_VENDOR_PRICE_ID",
];
const errors = required.filter((name) => !env[name]?.trim()).map((name) => `Missing ${name}`);
function url(name) {
  if (!env[name]) return;
  try {
    const parsed = new URL(env[name]);
    if (parsed.username || parsed.password || parsed.origin !== env[name]) throw new Error();
    return parsed;
  } catch {
    errors.push(`${name} must be an origin without credentials, path or trailing slash.`);
  }
}
const origin = url("COMMUNITY_ORIGIN");
if (origin && (origin.hostname === "cre-alexa-carloten80ten-090d.wix-site-host.com" ||
  !(origin.protocol === "https:" || (origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))))) {
  errors.push("COMMUNITY_ORIGIN must be localhost or a separate HTTPS staging origin.");
}
const database = url("COMMUNITY_SUPABASE_URL");
if (database && database.protocol !== "https:" &&
  !(database.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(database.hostname))) {
  errors.push("COMMUNITY_SUPABASE_URL must use HTTPS or a loopback development server.");
}
if (env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY &&
  (env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY === env.COMMUNITY_SUPABASE_SERVICE_ROLE_KEY ||
    /^sb_secret_/.test(env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY))) {
  errors.push("Use a publishable Supabase key separately from the server key.");
}
if (env.COMMUNITY_STRIPE_SECRET_KEY && !/^(sk|rk)_test_/.test(env.COMMUNITY_STRIPE_SECRET_KEY)) {
  errors.push("COMMUNITY_STRIPE_SECRET_KEY must be a Stripe test key.");
}
if (env.COMMUNITY_STRIPE_WEBHOOK_SECRET && !/^whsec_/.test(env.COMMUNITY_STRIPE_WEBHOOK_SECRET)) {
  errors.push("COMMUNITY_STRIPE_WEBHOOK_SECRET must be a webhook signing secret.");
}
if (env.COMMUNITY_VENDOR_PRICE_ID && !/^price_/.test(env.COMMUNITY_VENDOR_PRICE_ID)) {
  errors.push("COMMUNITY_VENDOR_PRICE_ID must be a Stripe Price ID.");
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log("Staging configuration shape passed. Verify project isolation and provider access before applying migrations or accepting traffic.");
}
