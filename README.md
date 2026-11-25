# CRE Alexa

CRE Alexa is a Wix Headless site built with Astro and React. The landing page serves the Nashville and Austin commercial real estate communities. Wix manages the site's content and business features.

- [Live site](https://cre-alexa-carloten80ten-090d.wix-site-host.com/)
- [Wix dashboard](https://manage.wix.com/dashboard/b0803dfc-1993-4431-8d83-4cc8083c7289)
- [Wix CLI quick start](https://dev.wix.com/docs/go-headless/get-started/quick-starts/wix-managed-headless/quick-start-with-the-wix-cli)

## Continue development

1. Use Node.js 22.12 or later and run `npm ci`.
2. To work against the live Wix site, sign in to the Wix CLI with an account that has access to CRE Alexa. Run `npx wix env pull` to reconstruct the local environment.
3. Run `npm run dev` to develop locally, `npx tsc --noEmit` to check types, and `npx astro build` to compile for Wix hosting.

The landing page is in `src/pages/index.astro`. Shared layout and styles are in `src/layouts/SiteLayout.astro` and `src/styles/brand.css`. Project identifiers are in `wix.config.json`. Local environment files are ignored.

To continue from a different GPT account, connect a GitHub identity with access to the repository and open this project there. Live Wix data and publishing access follow the Wix account and its site permissions.
