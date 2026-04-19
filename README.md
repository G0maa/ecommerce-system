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

## SQL Exercises

Each exercise is in `src/sql-exercises/` and implements the query **two ways**: raw SQL via `sql\`...\`` and the Kysely query builder. Run any exercise with its `pnpm` script (requires a running DB with migrations + seeds applied).

| Script | File | Challenge |
|--------|------|-----------|
| `pnpm ex1` | [src/sql-exercises/ex1.ts](src/sql-exercises/ex1.ts) | Daily revenue report for a specific date |
| `pnpm ex2` | [src/sql-exercises/ex2.ts](src/sql-exercises/ex2.ts) | Monthly top-selling products in a given month |
| `pnpm ex3` | [src/sql-exercises/ex3.ts](src/sql-exercises/ex3.ts) | Customers who spent > $500 in the past month (top 10) |

```bash
pnpm ex1   # daily revenue report
pnpm ex2   # monthly top-selling products
pnpm ex3   # high-value customers (past month)
```

## ERD
![ERD](./.diagrams/erd/erd.png)

## Challenges

### How we can apply a denormalization (uglification) mechanism on customer and order tables?
![denormalization](./.diagrams/challenges/denormalization/denormalization.png)