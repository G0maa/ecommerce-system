# Explanation

An e-commerce schema built with MySQL + [Kysely](https://kysely.dev/) + [`kysely-ctl`](https://github.com/kysely-org/kysely-ctl). Migrations and seeds live under `sql/`, schema types under `src/types.ts`.

## Running the project

### 1. Install packages

```bash
pnpm install --frozen-lockfile
```

### 2. Start MySQL (Docker)

```bash
docker compose up -d
```

Then copy env vars once:

```bash
cp .env.example .env
```

Defaults match `docker-compose.yml` (`root` / `password` / `test_db` on `localhost:3306`).

### 3. Run migrations

```bash
pnpm kysely migrate:latest         # apply all pending
pnpm kysely migrate:up             # apply the next one
pnpm kysely migrate:down           # revert the last one
pnpm kysely migrate:list           # show status
pnpm kysely migrate:make <name>    # scaffold a new migration
```

### 4. Run seeds

Populates the DB with faker-generated data (categories, customers, products, orders, order details).

```bash
pnpm kysely seed:run                   # run with defaults (~415k rows)
pnpm kysely seed:make <name>           # scaffold a new seed file
```

Scale via env vars (see top of `sql/seeds/*.ts`):

```bash
SEED_CUSTOMERS=1000000 \
SEED_ORDERS=5000000 \
SEED_PRODUCTS=50000 \
pnpm kysely seed:run
```

### 5. Reset state

Pick your level of scorched-earth:

**a. Roll back migrations** (keeps container + volume)
```bash
pnpm kysely migrate:rollback --all
```

**b. Drop & recreate the database** (fastest full wipe)
```bash
docker exec -i mysql-development mysql -uroot -ppassword \
  -e "DROP DATABASE IF EXISTS test_db; CREATE DATABASE test_db;"
pnpm kysely migrate:latest
```

**c. Nuke Docker + volume** (pristine MySQL instance)
```bash
docker compose down -v
docker compose up -d
pnpm kysely migrate:latest
```

## Challenges

### How we can apply a denormalization (uglification) mechanism on customer and order tables?
