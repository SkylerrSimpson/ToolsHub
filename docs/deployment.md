# Deployment contract

The target is `tools.skylerrsimpson.com`. No service or DNS record has been provisioned. Render remains only for the portfolio static frontend.

## Proposed hosting

Use one continuously running Node service for the hub and modern tools, plus PostgreSQL. Railway is the current candidate because it supports this arrangement and separate original services under one project. Keep its Serverless/app-sleeping setting disabled on the app and database. This avoids choosing an idle-suspension configuration similar to the old Dictionary backend. It does not guarantee availability or remove the need for monitoring and backups.

The four originals stay independently deployable. Dictionary, DevFinder and Todo each serve their React build and compatibility API on one origin, with a dedicated PostgreSQL database and least-privilege role. They may share one PostgreSQL instance with separate databases/roles; they must not share credentials or writable tables. Tip can use a static host or its provided static server, with no database. Suggested original subdomains are `original-dictionary`, `original-devfinder`, `original-todo` and `original-tip` under `skylerrsimpson.com`; none is configured yet.

References checked on 2026-11-06: [Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [Railway Next/PostgreSQL](https://railway.com/guides/nextjs), [Railway Serverless](https://docs.railway.com/deployments/serverless), [Railway PostgreSQL](https://docs.railway.com/databases/postgresql). Railway's guide includes a standalone Docker variant; this repository currently uses a normal `.next` build and `next start`. Do not use its standalone start command without changing and testing the artifact packaging.

## Modern service

| Setting                  | Value                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                  | Node 24, pnpm 11.18.0                                                                                                                        |
| Install                  | `corepack pnpm install --frozen-lockfile`                                                                                                    |
| Build                    | `corepack pnpm build`                                                                                                                        |
| Release migration        | `corepack pnpm db:migrate` with the intended database connection                                                                             |
| Start                    | `corepack pnpm start`                                                                                                                        |
| Listen                   | `0.0.0.0`, platform-provided `PORT` (Next defaults to 3000)                                                                                  |
| Artifact                 | `.next`, `public`, installed dependencies, package/config files; retain `scripts`, `src/server` and `migrations` for release/expiry commands |
| Static publish directory | None. Do not configure `out/` or a static-site service                                                                                       |
| Health check             | `/` proves the web process responds; separately monitor saved-data API/database availability                                                 |

Do not prune development dependencies from the release-command environment: migration/expiry scripts currently use `tsx`. A smaller runtime image can be added later with a separately compiled migration entry point. There is no tested application Dockerfile at present; Docker Compose is for local PostgreSQL only.

`DATABASE_URL` is server-only. Use a private connection with the provider's required TLS configuration, never disabled certificate verification. The bounded pool opens at most five connections per process; account for every replica and original service in the database connection budget. Do not add a pooler merely because one is available; configure/test one if deployment concurrency requires it.

Set `APP_ORIGIN=https://tools.skylerrsimpson.com` exactly, without a path/query. Writes require a matching `Origin`; cross-site writes are rejected. Set the origin to the preview domain when verifying previews, with a separate preview database. The cookie is host-only, so preview and production collections remain separate. Keep `NODE_ENV=production` in production. Never expose database URLs as `NEXT_PUBLIC_*` variables.

Set the four original URL variables before the build. They are compiled into the client-facing navigation. Rebuild after changing them. Source links should be updated only after the public repository exists.

Migrations are ordered, transactional and protected by a PostgreSQL advisory lock. Applied-file checksums prevent silent edits. Run them before new code receives traffic. Take a backup and review destructive schema changes separately. Application rollback does not reverse a schema migration. Schedule `pnpm db:expire` daily; it deletes expired sessions and their saved records. Configure backups, retention and a tested restore procedure explicitly.

## Required checks before public exposure

Anonymous session issuance is currently unthrottled. The 500-item limit per session does not bound creation of new sessions. Configure verified edge/proxy rate limits for cookie-free saved-list requests and mutations, with request size/time limits and monitoring. Choose the trusted client-IP mechanism only after the actual proxy is known; do not trust arbitrary forwarded headers. Test that limits apply across instances, return a useful 429 response, and do not interfere with normal use. This is a deployment gate, not an implemented feature.

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
