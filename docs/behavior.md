# Migration behavior contract

The original code, including mounted components and their API calls, defines the feature baseline. Design screenshots and unused template code do not establish additional features.

| Tool       | Preserved behavior                                                                                                                                                                                                         | Deliberate repairs                                                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dictionary | Purple sidebar/mobile navigation; default `hello`; search on submit; definitions, examples, phonetics, meaning synonyms, pronunciation and source links; star/unstar; saved list; query links; inline rename on Enter/blur | Atomic rename keeps the old record when a conflict fails; playable audio selection; bounded error states; keyboard edit action; focus-managed mobile navigation; cancellation of stale lookups |
| DevFinder  | Space Mono and pale-blue card layout; default `octocat`; public GitHub lookup; profile fields and counts; save/remove; saved cards and links back to live details                                                          | Zero counts stay zero; safe website links; missing field handling; accessible save/remove buttons; visible API/quota errors                                                                    |
| TodoList   | Narrow list, red title, Enter-to-add, toggle completion, delete, incomplete count                                                                                                                                          | Stable identity; controlled input; validation; pending-state guards; loading/error/retry; accessible controls                                                                                  |
| Tip        | Cyan two-column/stacked layout; presets 5/10/15/25/50; custom percentage committed with Enter; tip and total per person; Reset                                                                                             | Valid decimal drafts; whole positive people counts; no Infinity/NaN; Reset clears custom state; labels and focus styles                                                                        |

Theme/font selection, sorting, filtering, Todo text editing and bulk clearing were not functioning features in the inspected apps and have not been added. Tip has no new history, currency conversion or server dependency.

## Persistence change

The old APIs exposed globally shared anonymous collections. Both modern and maintained original versions now use private browser collections in PostgreSQL. This is an intentional behavior change. Original and modern databases/credentials remain separate; no legacy data has been imported.

The modern cookie has a fixed one-year lifetime. It is HttpOnly and Secure with a `__Host-` prefix in production. Web Locks serialize saved-list initialization across tabs. Browsers without Web Locks receive an explicit storage initialization error; lookups and Tip remain available. Production must use HTTPS.

## Verification boundaries

Parser/calculation/API tests cover malformed external data, zero counts, unsafe links, validation, cookie protection, origin checks and concurrency in session initialization. PostgreSQL tests exercise actual ownership queries, duplicate conflicts, atomic rename, item limits and expiry. Browser tests cover normal workflows, reloads, direct nested URLs, two browser identities, simultaneous tabs, keyboard navigation and narrow layouts.

The presence of a test is not evidence that it ran. See [verification](verification.md). Manual comparison with original desktop/mobile layouts, pronunciation playback, zoom, long content, focus after row deletion and live upstream requests still needs a browser-capable environment.
