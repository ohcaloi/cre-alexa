import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, envField } from 'astro/config';
import wix from "@wix/astro";
import wixPages from "@wix/astro-pages";

import react from "@astrojs/react";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

// https://astro.build/config
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  integrations: [wix(), wixPages(), react()],
  security: { checkOrigin: false },
  adapter: wixHostingAdapter(),

  image: {
    domains: ["static.wixstatic.com"],
  },

  output: "server",

  // Community (Supabase/Stripe) settings, set per environment with `wix env set` (live) or
  // .env.local (local). All optional: when missing, the community pages show "unavailable".
  env: {
    schema: {
      COMMUNITY_ORIGIN: envField.string({ context: "server", access: "secret", optional: true }),
      COMMUNITY_SUPABASE_URL: envField.string({ context: "server", access: "secret", optional: true }),
      COMMUNITY_SUPABASE_PUBLISHABLE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      COMMUNITY_SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      COMMUNITY_STRIPE_SECRET_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      COMMUNITY_STRIPE_WEBHOOK_SECRET: envField.string({ context: "server", access: "secret", optional: true }),
      COMMUNITY_VENDOR_PRICE_ID: envField.string({ context: "server", access: "secret", optional: true }),
      COMMUNITY_MAPS_EMBED_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});