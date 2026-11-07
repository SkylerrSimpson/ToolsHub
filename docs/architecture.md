# Architecture

The hub and modern tools are one Next.js application, separate from the portfolio. Tool-specific components, domain types and API clients belong in `src/features/<tool>`. Routes compose features; the root layout must not fetch tool data. Shared UI primitives and a typed tool registry support consistent navigation without sharing unrelated application state.

## Persistence

Dictionary, DevFinder and TodoList use PostgreSQL through server-only Next route handlers. Each visitor receives an opaque, HttpOnly browser identity cookie. Records are private to that identity, without login or cross-device synchronization. Clearing the cookie loses access to saved records. Client-supplied owner IDs are never trusted. Tip performs arithmetic locally and has no database requirement.

Use one database with explicit tables and per-tool queries, one bounded connection pool and versioned migrations. Development PostgreSQL runs in a dedicated Docker Compose service. Application containers are optional deployment packaging, not a prerequisite for development. PostgreSQL resources, ports and volumes must be independent of other local projects.

## Versions

Original repositories remain independent. Their React interfaces and workflows are preserved, while PostgreSQL replaces MongoDB through documented compatibility maintenance. Original and modern data and credentials must be isolated. Original API identities and response shapes are preserved where the existing UI depends on them. No original database records are imported by default.

## Deployment

Render is reserved for the existing portfolio static frontend. This hub requires a Next-capable server host and PostgreSQL, not static export. Provider selection must account for idle startup latency, operational burden and cost; a successful build does not verify deployed routing or persistence. Original applications also move off Render, with their static assets and compatibility API served from a single origin where practical.

The modern tools share one release and runtime. Separate feature modules do not provide independent deployments. An external tool can be linked from the central registry without joining this runtime.
