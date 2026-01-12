## Prisma README for NestJS with PostgreSQL


This guide covers essential Prisma commands and steps for initializing and managing database in a NestJS project.

---

## Prerequisites

- Set up **PostgreSQL** database.

- create `.env` with the same sturacture as `.env.example` and put the database credential to `DATABASE_URL` like:

```bash
 DATABASE_URL="postgresql://user:password@host:port/db?schema=public"
 ```
- Make sure`DATABASE_URL` environment variable is set and points to the target Postgres DB.

- Make sure prisma/schema.prisma and prisma/migrations/ exist in the repo.

- Make sure Node modules installed (npm ci or yarn install).

## Quick commands

## 1. Generate Prisma Client

```bash
npx prisma generate
```

**When**: After changing schema.prisma or before building the app.

**What it does:** Generates the @prisma/client code used by your app.

## 2. Apply development migration (local/dev only)

```bash
npx prisma migrate dev --name <migration_name>
```

**When:** During local development to create a new migration and apply it.

**What it does:** 
- Creates a migration file under `prisma/migrations/`

- Updates the local databas

- Regenerates the Prisma client automatically

## 3. Apply migrations in production (non-interactive)

```bash
npx prisma migrate deploy
```

**When:** 
- The first time connecting Prisma to the production/external database

- Any time schema changes have been made and new migrations exist

**What it does:** 
- Applies all existing migration files to the target database

- Does not create new migrations

- Safe for CI/CD and production use

## 4. Reset DB (destructive — dev only)

```bash
npx prisma migrate reset
```

**When:** Local testing when you want a clean DB.
**What it does:** 
- Drops and recreates the database

- Reapplies all migrations

- **⚠️ Never run this in production** — it will delete all data, unless you want to clear all data.

## 5. Open Prisma Studio (visual DB inspector)

```bash
npx prisma studio
```

**When:** Local development/inspection only.

**What it does:** Opens a browser UI to browse/edit data.


## Example production command sequence

```bash
# 1. Ensure DATABASE_URL is set in the environment

# 2. Install dependencies
npm ci

# 3. Generate Prisma client
npx prisma generate

# 4. Apply schema migrations to the database
npx prisma migrate deploy

# 5. Start the NestJS app
npm run start:prod

```