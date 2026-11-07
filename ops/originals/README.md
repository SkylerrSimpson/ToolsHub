# Local infrastructure for the originals

These files coordinate four **independent maintained original checkouts**. No original source, Git history or dependencies are vendored here. Each application can instead use its standalone README and a dedicated PostgreSQL service.

The required `maintained-original` branches currently exist locally under `~/tools-originals`; they have not been pushed. Cloning the public main branches will not supply these maintenance changes yet. Once those branches are published, use the reviewed maintenance revisions.

From the hub root, with the four checkouts present:

```sh
python3 ops/originals/create-local-env.py --workspace ~/tools-originals
docker compose --env-file ~/tools-originals/.env -f ops/originals/compose.yaml up -d --wait
```

The generator validates the checkouts, refuses existing environment files, and writes mode 0600 random credentials without printing them. If configuration already exists, reuse it instead of rerunning the generator. Never overwrite a database password file without changing the corresponding database role.

The Compose project is `tools-originals`, with PostgreSQL bound to loopback port 55433 and separate databases/roles for Dictionary, DevFinder and Todo. Tip has no database. Database initialization runs only for a new volume. This is local infrastructure, not a production deployment template.

In each checkout, follow its README to install, migrate, build and start. The ports are 4101, 4102, 4103, 4104 respectively. Once an original is running, set its `NEXT_PUBLIC_ORIGINAL_*_URL` in the hub environment and restart the hub. Until then, the directory links to its source repository. Its database uses another Compose project and port 55432.
