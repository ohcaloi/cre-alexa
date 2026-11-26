# CRE Alexa handoff for Claude Code

## 1. Connect GitHub first

The repository is [ohcaloi/cre-alexa](https://github.com/ohcaloi/cre-alexa). Sign in to GitHub as `ohcaloi` or with an account that has write access. Claude Code uses the Git credentials available in the terminal. Wix, Supabase and Resend have their own sign-ins. [GitHub CLI authentication](https://docs.github.com/en/github-cli/github-cli/authenticating-with-github-cli) · [Claude Code quickstart](https://code.claude.com/docs/en/quickstart)

```powershell
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
gh auth status
gh repo view ohcaloi/cre-alexa --json visibility,defaultBranchRef
```

**Verified on November 26, 2026:** GitHub reports the repository is **public**. Its `main` is at `604ddf9`, an earlier landing-page snapshot. The local workspace at `D:\ChatGPT Projects\Alexa Project` has no configured Git remote, its last commit is `984e3f0`, and the newer design and community work are uncommitted there. A clone of GitHub `main` alone will miss that work. If the repository should be private, change its visibility in GitHub before uploading the handoff branch.

If you cloned the **codex/claude-handoff** branch, it already contains this handoff snapshot. Skip the transfer step and continue with local setup.

**For Claude Code on this computer**, open the existing workspace to get the latest files immediately:

```powershell
Set-Location 'D:\ChatGPT Projects\Alexa Project'
claude
```

**To continue from GitHub on another computer**, create a branch from a fresh clone on this computer, then copy the reviewed source into it. This keeps the GitHub branch history intact and leaves the existing workspace in place. Run the following after confirming repository visibility. The clone path must be a new directory.

```powershell
$workspace = 'D:\ChatGPT Projects\Alexa Project'
$clone = 'D:\ChatGPT Projects\cre-alexa-handoff'
gh repo clone ohcaloi/cre-alexa $clone
if ($LASTEXITCODE -ne 0) { throw 'GitHub clone failed.' }
Set-Location -LiteralPath $clone
git switch -c codex/claude-handoff
if ($LASTEXITCODE -ne 0) { throw 'Could not create the handoff branch.' }

$paths = @(
  '.env.example', '.gitignore', 'AGENTS.md', 'CLAUDE.md', 'HANDOFF.md', 'PLANS.md', 'README.md',
  'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json',
  'wix.config.json', 'wrangler.json', 'docs', 'public', 'scripts', 'src', 'tests',
  'supabase/migrations', 'supabase/templates', 'supabase/demo-listings.sql', 'supabase/seed.sql'
)
$trustedPath = $workspace.Replace('\', '/')
$files = git -c "safe.directory=$trustedPath" -C $workspace ls-files --cached --others --exclude-standard -- $paths
if ($LASTEXITCODE -ne 0 -or !$files) { throw 'Could not read the workspace file list.' }
foreach ($relative in ($files | Sort-Object -Unique)) {
  $from = Join-Path $workspace $relative
  if (!(Test-Path -LiteralPath $from -PathType Leaf)) { continue }
  $to = Join-Path $clone $relative
  New-Item -ItemType Directory -Path (Split-Path -Parent $to) -Force | Out-Null
  Copy-Item -LiteralPath $from -Destination $to
}
git add -- $paths
git diff --cached --name-only
git diff --cached --stat
```

Review the staged files before committing. Of the environment files, transfer only `.env.example`. Keep `.env.local`, `.dev.vars*`, `supabase/.temp`, `.taste-skill`, `node_modules`, generated builds and `cre-alexa-source.zip` outside the handoff. The existing ZIP is an earlier artifact. Review any existing `CLAUDE.md` in the clone alongside the current `AGENTS.md`.

```powershell
git commit -m "Hand off CRE Alexa website and staged community work"
git push -u origin codex/claude-handoff
```

On the other computer, authenticate as above and clone the handoff branch after it is pushed:

```powershell
gh repo clone ohcaloi/cre-alexa -- --branch codex/claude-handoff
Set-Location cre-alexa
claude
```

## 2. Run the site locally

CRE Alexa is a Wix Headless Astro and React site for commercial real estate communities in Nashville and Austin. Wix owns the existing site content and commerce. The opt-in community under `/community` uses the separate **CRE Alexa Staging** Supabase project. Payments for the new community use Stripe sandbox only.

- [Live CRE Alexa site](https://cre-alexa-carloten80ten-090d.wix-site-host.com/)
- [Wix dashboard](https://manage.wix.com/dashboard/b0803dfc-1993-4431-8d83-4cc8083c7289)
- [CRE Alexa Staging Supabase dashboard](https://supabase.com/dashboard/project/ocuahdnxckjslbhrqxdt)
- Wix site ID `b0803dfc-1993-4431-8d83-4cc8083c7289`; Wix app ID `ba150266-3161-4234-b7f0-850ed35c936d` in `wix.config.json`.

Use Node.js 22.12 or later. Restore Wix credentials through an authorized Wix account and recreate the ignored `.env.local` with the staging Supabase URL, publishable key, and exact local origin. The previous preview used `http://127.0.0.1:4327`. Add server-only values through the appropriate secret settings as each integration is configured. `.env.example` lists the variable names.

```powershell
npm ci
npm run wix -- login
npm run env -- pull
npm test
npm run build
npm run astro -- preview --host 127.0.0.1 --port 4327
```

Use a free local port and update `COMMUNITY_ORIGIN` to match it if needed. A loopback preview is only reachable from the computer running it. Read `AGENTS.md` before working with Wix APIs or releases. Use the documented Wix source flow for this site and explicit approval for a live release or production database change. [Community deployment](docs/community-deployment.md)

## 3. What is live and what is staged

| Area | Verified status |
| --- | --- |
| Public Wix design | The client review release is live. It includes the Openbrief-inspired photo hero, CRE615 and CRE512 green palette, glass styling, photo-backed footer, hosting and sponsorship section, and FAQ. The homepage and main public routes were checked on the live host. |
| Wix apps | Wix Forms, Events and Tickets, Bookings, Table Reservations, Pricing Plans, Store, Blog, and the existing checkout routes remain wired to Wix. Page loads were checked. Full transactions and email confirmations still need end-to-end verification. |
| Public community directories | About, Venues, Vendor Directory, and Sponsors are live. The real listing documents have not arrived, so the live directories are awaiting content. |
| Latest design changes | The new `CRE615-155.jpg` group photo is optimized for desktop and mobile. The sticky menu frosts on scroll and uses a mint-green highlight for hover and keyboard focus. These changes were tested locally and await a separate Wix release. |
| Staging directory samples | 20 fictional venues, 20 fictional vendors, and 20 fictional sponsors were added to the separate staging database. Cards are labeled **Sample listing**. Search, vendor category filtering, venue pagination, Previous and Next links, and sample parking were checked in the preview. |
| Membership tiers | **Standard** includes profile and résumé features and eligibility to apply for a vendor listing. **Premium** adds private events and articles. **Sponsor** includes Premium access and can edit its assigned sponsor page. Access rules were tested in staging using test identities. Real browser sign-in and checkout are still pending. |
| Member and billing tools | Profile, private résumé storage, account dashboard, Stripe checkout and portal, vendor review, and payment webhook handling are implemented in staging. These flows still need provider setup and end-to-end tests. |

The public release’s Wix Code Store revision was `ac4a8071f5689d132de33f571a476d02265ccc7c` when verified. Check the current revision before preparing a release. The previous Wix upload was built from the published source with only the approved public changes applied. A whole-workspace release would include staging account and billing routes. GitHub pushes and Wix releases are separate actions.

## 4. What to finish, in order

1. **Finish staging email delivery.** A one-time-code request using Resend’s simulated recipient reached Supabase and returned `Error sending confirmation email`. The earlier sender screenshot showed the placeholder `noreply@yourdomain.com`. In the account dashboard, connect Resend to **CRE Alexa Staging** and save a sender on a domain verified by Resend. In Supabase Authentication → Emails → Templates, use [`supabase/templates/community-email-code.html`](supabase/templates/community-email-code.html) for both **Confirm sign up** and **Magic link**. Set the subject to `Your CRE Alexa sign-in code`. The template uses `{{ .Token }}`. Verify first registration, inbox receipt, entering the code, and returning-member sign-in in staging. Use an authorized test inbox and keep API keys and one-time codes out of Git and chat. If a CAPTCHA error appears, inspect the current staging CAPTCHA configuration and wire the corresponding challenge into the form if enabled. [Resend integration](https://supabase.com/partners/resend) · [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
2. **Test the member dashboard in a browser.** Check account creation and repeat sign-in, editing the profile, uploading and downloading a private PDF résumé, and protecting it from another member. Verify access to a private event and article as Standard and Premium, then verify that Sponsor can edit only its assigned page. The first administrator also needs a verified account and MFA enrollment.
3. **Set membership prices and test Stripe sandbox.** Confirm whether Standard is free and decide Premium and Sponsor pricing and billing intervals. Configure test checkout, webhooks, and the Customer Portal. Verify saved payment methods, plan changes, cancellation, and failed payments. The existing Stripe code only accepts sandbox credentials. [Billing setup](docs/community-deployment.md)
4. **Verify the one-time $65 vendor fee.** Create a USD 65.00 sandbox price, then test the flow from active membership through application, payment, approval, public listing, and refund. The demo listings are already approved so their layout can be reviewed.
5. **Replace samples with real listing content.** Add approved venue names, addresses and parking details, plus vendor and sponsor names, logos, descriptions and website links. Sample parking shows the layout. Real-time vacant spaces still require a data provider. Deploy real directory content only after its source and publication approval are clear.
6. **Run the original Wix app flows end to end.** Submit the contact form to an authorized test destination, verify event registration and ticket confirmation, book a service and table, and test Wix pricing plan and store checkout through order confirmation. Keep Wix purchases separate from the new Stripe community membership tests.
7. **Prepare the next approved Wix release.** The immediate public candidate is the new group photo and liquid-glass menu. Keep the sample data, OTP work and Stripe sandbox features in staging. A production community launch also needs approved terms and privacy copy, production secret setup, and a separate billing review.

## 5. Where to look in the code

| Topic | Files |
| --- | --- |
| Homepage, header, footer | `src/pages/index.astro`, `src/layouts/SiteLayout.astro`, `src/components/SiteFooter.astro` |
| Design and hero assets | `src/styles/home.css`, `src/styles/glass.css`, `src/styles/brand.css`, `src/styles/global.css`, `public/images/cre615-event-hero.webp`, `public/images/cre615-event-hero-mobile.jpg` |
| Sign-in and accounts | `src/pages/community/access.astro`, `src/pages/community/account.astro`, `src/pages/api/community/action.ts`, `supabase/templates/community-email-code.html` |
| Membership, billing and listings | `src/pages/community/membership.astro`, `src/pages/community/[directory]/`, `src/pages/community/admin.astro`, `src/pages/api/community/billing.ts`, `src/pages/api/community/webhook.ts` |
| Fixtures, policies and tests | `supabase/demo-listings.sql` is staging-only. See `supabase/migrations/`, `tests/community-db.test.mjs`, `tests/staging-preflight.test.mjs`, and `tests/stripe-event.test.mjs`. `npm test` passed all three tests at handoff. |

### Paste into Claude Code after setup

```text
Read HANDOFF.md and AGENTS.md before making changes. Confirm whether this is the original workspace or the GitHub handoff branch. Continue CRE Alexa from the staged one-time-code email delivery blocker. Verify the CRE Alexa Staging project and use the prepared template for both registration and returning-member email. Keep production Wix and the production database unchanged unless I explicitly approve a release or change. After delivery works, test member profiles and membership access in staging and report what you verified.
```
