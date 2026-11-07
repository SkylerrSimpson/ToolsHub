# Verification record

Local implementation checks, 2026-11-06. No deployment has occurred.

| Check                                  | Result                                                                                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict TypeScript and Next route types | Passed                                                                                                                                                                             |
| Behavior/API/session unit tests        | 24 passed                                                                                                                                                                          |
| Real PostgreSQL integration            | Explicitly skipped without `TEST_DATABASE_URL`; not verified                                                                                                                       |
| Production Next build                  | Passed; includes dynamic saved-data API routes                                                                                                                                     |
| Browser suite discovery                | Seven workflows load and type-check                                                                                                                                                |
| Browser execution                      | Blocked before tests: local web server cannot bind (`listen EPERM`)                                                                                                                |
| Local preview                          | Not running; `127.0.0.1:3100` listener denied                                                                                                                                      |
| Docker/PostgreSQL startup              | Blocked by Docker socket permissions                                                                                                                                               |
| Modern clean online install            | Not verified; packages available from existing caches support the successful build, but normal registry access/supply-chain metadata verification did not complete                 |
| Dependency advisory lookup             | npm's official bulk-advisory endpoint returned no matches for 175 installed modern package names; this is not a guarantee about every optional platform package or future advisory |
| Formatting                             | Final check recorded after source formatting                                                                                                                                       |
| CI workflow                            | Authored, not run on GitHub                                                                                                                                                        |
| Live HTTP/API/deployment               | Not run                                                                                                                                                                            |

Unit coverage includes malformed Dictionary/GitHub responses, unsafe links, zero counts, external 404/rate-limit errors, calculations and invalid numeric inputs, bounded JSON, strict input validation, origin checks, cookie parsing and cross-tab initialization ordering.

The database suite exercises real queries for ownership/read isolation, duplicate handling, atomic rename, expiry and concurrent item limits. Its skipped status must not be reported as a pass. Browser persistence tests use a migrated disposable test database and real Next API routes, with fixtures only for external lookups.

Outstanding review includes manual visual comparison with originals, keyboard behavior after row edits/deletions, 320px layouts, zoom and long content, pronunciation playback and live CORS/API behavior. Backend review identified the first-visit cookie race; client initialization now uses Web Locks and has a unit regression test. Anonymous session issuance still requires deployment rate controls.

All four maintained original frontends also pass locked clean installs, CI-mode production builds and their targeted React regression tests. Three saved-data servers have six passing validation/cookie tests in total. Their real HTTP/database/browser checks remain unverified. See each original repository's `VALIDATION.md` for the dependency review and exact limits.
