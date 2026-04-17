# Explanation

## Running migrations (TL;DR)
Migrations are managed with [`kysely-ctl`](https://github.com/kysely-org/kysely-ctl), configured via `kysely.config.ts`.
1. **Install deps and start MySQL**
   ```bash
   pnpm install --frozen-lockfile
   docker compose up -d
   ```
2. **Configure env** — copy `.env.example` to `.env` and adjust if needed. Defaults match `docker-compose.yml` (`root` / `password` / `test_db` on `localhost:3306`).
3. **Run migrations**
   ```bash
   pnpm kysely migrate:latest   # apply all pending migrations
   pnpm kysely migrate:up       # apply the next one
   pnpm kysely migrate:down     # revert the last one
   pnpm kysely migrate:list     # show status
   ```
4. **Create a new migration**
   ```bash
   pnpm kysely migrate:make <name>
   ```
   New files land in `migrations/` with an `up` / `down` pair.