# Verification record

GitHub Actions passed for revision `4fb27aa` on 2026-11-07 UTC: [Checks run](https://github.com/SkylerrSimpson/ToolsHub/actions/runs/42324183430). No hub deployment has occurred.

| Check                                     | Result                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| Clean locked installation                 | Passed on a fresh GitHub runner, including pnpm supply-chain verification |
| Formatting                                | Passed                                                                    |
| Strict TypeScript and Next route types    | Passed                                                                    |
| Behavior/API/session and PostgreSQL tests | 25 passed, none skipped                                                   |
| Production Next build                     | Passed; includes dynamic saved-data API routes                            |
| Chromium browser workflows                | Seven passed against a local Next development server and PostgreSQL       |
| Hosted Vercel/Neon integration            | Not run                                                                   |
| Custom-domain deployment                  | Not run                                                                   |

The database tests execute real queries for ownership/read isolation, duplicate handling, atomic rename, expiry and concurrent item limits. Browser workflows exercise Dictionary save/rename/refresh/delete, DevFinder save/remove, Todo persistence and browser isolation, simultaneous first visits, tip calculations, keyboard focus, 360px layouts and an unknown-route 404. External Dictionary/GitHub responses are fixtures, so these checks do not establish live upstream availability, CORS or pronunciation playback.

Local TypeScript, unit tests, formatting and production builds also passed. Local database/browser execution was restricted by Docker socket and listener permissions; the successful runtime checks above were performed on the GitHub runner. A targeted query to npm's official bulk-advisory endpoint previously returned no matches for 175 installed modern package names. It does not establish the status of every optional platform package or future advisory.

## Remaining deployment checks

Verify the actual Vercel build and function routing, Neon pooled connections, database role permissions/timeouts, sleep/resume behavior, production cookies, scheduled expiry, backups and rate controls. Anonymous session issuance requires the configured and tested firewall rule described in [deployment](deployment.md). A production build and development-server browser suite do not establish those hosted behaviors.

Manual visual comparison with originals, 320px layouts, zoom, long content and live pronunciation/API behavior remain outstanding. The hub uses shadcn Item, Button and Separator components; each tool retains its own layout. Original links now point to the published maintenance branches unless a verified live-original URL is configured.

## Maintained originals

All four frontends pass locked clean installs, CI-mode production builds and targeted React regression tests. Three saved-data servers have six passing validation/cookie tests in total. Their real HTTP/database/browser checks remain unverified.

The Vercel adapters additionally pass all four staged production builds and 18 deployment tests. These cover compiled asset inclusion, private-file/source-map exclusions, missing assets, bounded route configuration and secure adapter initialization. They do not emulate Vercel's function tracing or rewrite engine. Tip's manifest no longer references icon files that were absent from the original repository.

The `maintained-original` branches are published independently in the four source repositories. Deploy from those branches, not their historical `main` branches. See each original's `DEPLOYMENT.md` and `VALIDATION.md` for settings, remaining dependency findings and runtime checks.
