# Deployment contract

The target is `tools.skylerrsimpson.com`. No service or DNS record has been provisioned. Render remains only for the portfolio static frontend.

## Proposed hosting

Target Vercel Hobby for the hub and modern tools, plus Neon Free for PostgreSQL. The budget is zero recurring hosting charges within the free allowances. Keep the accounts on their free plans rather than starting paid trials or enabling paid add-ons. These are personal, non-commercial applications, consistent with Vercel Hobby's intended use. Exceeding a free allowance can interrupt service; free hosting is not an uptime guarantee.

Neon Free suspends compute after five idle minutes and automatically wakes it on a new query. Its documentation describes reactivation in a few hundred milliseconds; actual application latency must be measured. Dictionary and GitHub lookups already run independently of saved-data storage. Verify saved-list loading and the first write after inactivity, including timeouts and retries. Do not use keep-alive traffic to prevent suspension.

The four originals stay independently deployable in separate Vercel projects. Dictionary, DevFinder and Todo each need their React build and compatibility API on one origin, with a separate Neon project and application role. They must not share the modern database, credentials or writable tables. Tip is a static React deployment with no database. Suggested original subdomains are `original-dictionary`, `original-devfinder`, `original-todo` and `original-tip` under `skylerrsimpson.com`; none is configured yet. The original Node launchers need deployment adapters and asset routing for Vercel; their local startup commands alone are not a Vercel deployment.

References checked on 2026-11-06: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Vercel package managers](https://vercel.com/docs/package-managers), [Neon plans](https://neon.com/docs/introduction/plans), [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero), [Vercel Express](https://vercel.com/docs/frameworks/backend/express).

## Modern service

| Setting            | Value                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Framework          | Next.js, using Vercel's native integration                                                    |
| Runtime            | Node 24, pnpm 11.18.0; versions pinned in `package.json`                                      |
| Package manager    | Set `ENABLE_EXPERIMENTAL_COREPACK=1` in the project                                           |
| Install            | `corepack pnpm install --frozen-lockfile --prod=false`                                        |
| Build              | `corepack pnpm build`                                                                         |
| Migration          | Run `corepack pnpm db:migrate` separately with the intended database before releasing traffic |
| Start              | Managed by Vercel; do not configure a persistent `next start` process                         |
| Output directory   | Leave the Next.js preset default; do not set `out/` or add a catch-all SPA rewrite            |
| Region             | Choose a function region near the Neon database when provisioning                             |
| Availability check | `/` proves the page responds; separately monitor saved-data API/database availability         |

The install/build settings are recorded in `vercel.json`. A clean Vercel build has not yet been verified. Keep development dependencies available to the migration/expiry command environment, since those scripts use `tsx`. Do not run production migrations automatically from every preview build or application cold start.

`DATABASE_URL` is server-only. Use Neon's TLS connection configuration, never disabled certificate verification. Use a pooled connection for concurrent serverless requests after validating the driver startup parameters, prepared statements, transactions and connection lifecycle against Neon. The existing pool permits five connections per process, not five across the deployment. Its compatibility with a pooled Neon endpoint and suspended Vercel instances still needs integration verification. Use a direct connection for administrative migration commands. Keep schema ownership privileges separate from ordinary application access.

Set `APP_ORIGIN=https://tools.skylerrsimpson.com` exactly, without a path/query. Writes require a matching `Origin`; cross-site writes are rejected. Set the origin to the preview domain when verifying previews, with a separate preview database. The cookie is host-only, so preview and production collections remain separate. Keep `NODE_ENV=production` in production. Never expose database URLs as `NEXT_PUBLIC_*` variables.

Set the four original URL variables before the build. They are compiled into the client-facing navigation. Rebuild after changing them. Source links should be updated only after the public repository exists.

Migrations are ordered, transactional and protected by a PostgreSQL advisory lock. Applied-file checksums prevent silent edits. Run them before new code receives traffic. Take a backup and review destructive schema changes separately. Application rollback does not reverse a schema migration. Schedule `pnpm db:expire` daily; it deletes expired sessions and their saved records. No hosted schedule is configured yet. A Vercel cron integration would require an authenticated handler; the command-line script is not an HTTP endpoint. Configure backups, retention and a tested restore procedure explicitly, within the selected free plan's limits.

For a conventional Node host, the existing build/start contract remains `corepack pnpm build` followed by `corepack pnpm start`, listening on `0.0.0.0` and the supplied `PORT`. Retain `.next`, `public` and runtime dependencies. There is no tested application Dockerfile; Docker Compose currently provides local PostgreSQL only.

## Required checks before public exposure

Anonymous session issuance is currently unthrottled. The 500-item limit per session does not bound creation of new sessions. Vercel Hobby currently includes one rate-limit rule per project within its three custom firewall rules. Configure that rule to cover the saved-data API, including cookie-free reads and mutations, using the provider's IP key and a 429 response. This avoids application code trusting arbitrary forwarded headers. Counters are regional, not a global exact cap. Verify enforcement across instances, client handling of 429 responses and the selected plan's included usage before public exposure. No rule has been configured yet. See [Vercel rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

Complete a clean network-enabled modern install, real PostgreSQL integration, HTTP contract tests for originals and browser checks. Review the remaining original dependency advisories and build the CRA sources in an isolated build step. Serve generated static files with the maintained server, never the legacy CRA development server. Exclude `.env`, `.git`, development dependencies and source maps from original runtime artifacts. The owning account must revoke or confirm prior revocation of the historically exposed Todo credential. No history rewrite is required.

## Live acceptance

Verify the preview host first, then repeat on the custom domain after DNS/TLS is active:

1. Open `/`, all four tool routes, both saved-list routes and query URLs directly. Refresh nested routes and navigate with Back/Forward. Check fonts, chunks, images and narrow layouts.
2. Verify HTTP 404 for an unknown route and missing asset. Check any configured redirects for destination, status and query preservation. There is no blanket SPA rewrite for the modern Next server.
3. Inspect the actual HTTPS session cookie: host-only, Secure, HttpOnly, SameSite and lifetime. Verify normal writes, cross-origin rejection, two-browser isolation, simultaneous tabs and storage after refresh.
4. Use disposable synthetic saves to check add/rename/delete words, save/remove profiles and add/toggle/delete tasks. Verify API unavailability leaves lookup usable and errors visible. Remove synthetic records afterward.
5. Check Dictionary and GitHub requests from the deployed browser, plus pronunciation, avatars, missing-result and quota errors. Fixture-based browser tests do not establish those live integrations.
6. Open every original link and its nested routes directly, check original/modern labels and separate data, then confirm unknown paths/assets return 404.
7. Inspect platform build/start logs without exposing connection strings. Verify database backups, restore, limits, expiry scheduling, monitoring and restart persistence.

Record URLs, revisions, commands, outputs and remaining limitations in the release record. A framework build alone does not establish hosting correctness.
