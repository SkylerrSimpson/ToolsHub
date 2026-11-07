# Skyler's tools

A home for Dictionary, DevFinder, TodoList and a tip calculator, with links to their maintained original versions. This project is independent of the portfolio.

The modern tools use Next.js, TypeScript, Tailwind and Radix UI primitives. Dictionary, DevFinder and TodoList save data in PostgreSQL through same-origin route handlers. Tip runs locally in the browser. Public dictionary and GitHub lookups do not depend on the saved-data database.

## Local development

Use Node 24, pnpm 11.18.0 and Docker Compose. The package manager is pinned in `package.json`.

```sh
corepack pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d --wait
corepack pnpm db:migrate
corepack pnpm dev
```

Open **http://127.0.0.1:3100**. Keep that hostname consistent with `APP_ORIGIN`, since writes validate the exact origin. Port 55432 and the `tools-hub` Compose project are dedicated to this application's local PostgreSQL. Example credentials are local-only. Stop the database with `docker compose stop`; do not remove its volume when you want to retain saves.

Without PostgreSQL, the directory, calculator and external lookups still render; saved-data controls report unavailable storage. There is no fallback that silently moves records to browser storage.

Maintained originals live in separate repositories. Their local ports are 4101–4104, linked automatically in development. Follow their own setup instructions; the hub does not install or start them. Production original links use the four `NEXT_PUBLIC_ORIGINAL_*_URL` variables in `.env.example` and must be set before building. Unconfigured links lead to original details instead of implying a live deployment.

The optional [original database setup](ops/originals/README.md) is versioned here for convenience; it operates on separate checkouts and does not share their source or dependencies.

## Saving and privacy

There are no accounts. An opaque HttpOnly cookie identifies one browser collection; only its hash is stored. Records are scoped to the verified session in every query. Clearing the cookie loses access, and another browser/device starts a separate collection. The identity expires one year after its first saved-list visit. There is no account recovery or legacy-data import.

Modern saves have a limit of 500 items per tool per session. This is a storage limit, not request throttling. Configure and verify production abuse controls before public deployment, as described in [deployment](docs/deployment.md). Run `pnpm db:expire` daily against the intended database to remove expired identities and their records. It performs a deletion, so use the correct environment.

## Checks

```sh
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

`pnpm test` includes real PostgreSQL integration when `TEST_DATABASE_URL` is configured. Without it, that test is explicitly skipped. It uses a separate test database and disposable schema; it refuses the application's database. Compose initializes a test role and database on first volume creation.

For browser checks, first migrate the disposable test database:

```sh
DATABASE_URL=postgres://tools_hub_test:local-test-only@127.0.0.1:55432/tools_hub_test corepack pnpm db:migrate
corepack pnpm exec playwright install chromium
BROWSER_DATABASE_URL=postgres://tools_hub_test:local-test-only@127.0.0.1:55432/tools_hub_test corepack pnpm test:browser
```

Playwright starts a separate development server at port 3101. Browser persistence tests require that explicit loopback `_test` database; other tests run without it. External APIs are intercepted with controlled fixtures, so these tests do not prove live upstream availability. The workflow in `.github/workflows/checks.yml` runs locked installation, formatting, types, database tests, build and browser checks in a fresh environment. See [verification](docs/verification.md) for actual results, including checks not yet executed successfully.

## Structure and additions

- `src/app`: route composition and thin API handlers.
- `src/features/<tool>`: each tool's UI and parsing/calculation logic, with scoped styles.
- `src/server`: session, validation, migrations and explicit PostgreSQL operations.
- `src/lib/tools.ts`: the single directory/version-navigation registry, including icons and categories.
- `src/components/ui`: shared accessible primitives.
- `migrations`: ordered, checksummed SQL. Add migrations; never edit an applied one.

Add a tool's routes and feature folder, then one registry entry. Keep unrelated state and service calls out of the root layout. Only add database tables when the tool needs persistence. An externally hosted tool can use an external registry URL without joining this runtime. See [architecture](docs/architecture.md) and the [behavior contract](docs/behavior.md).

## Deployment

This is a Node application, not a static export. `pnpm build` produces `.next`; `pnpm start` serves the application and its API on the platform's `PORT`. There is no `out/` publish directory. Render is reserved for the separate portfolio.

No public hub repository, hosting service or domain deployment has been created yet. See [deployment](docs/deployment.md) for the proposed arrangement, exact runtime inputs and live verification requirements.
