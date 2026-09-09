# TanStack Start on Nibrun

[![Deploy on nibrun](https://nibrun.com/button.svg)](https://app.nibrun.com/deploy?name=tanstack-start-nibrun&port=3000)

A small TanStack Start application packaged as one Linux x64 Bun binary. It renders on the server, records each server-function call in SQLite, and displays the complete call log with TanStack Query.

## Included

- Server-side rendered React application with TanStack Start
- TanStack Query call-log query and mutation
- SQLite database with versioned SQL migrations and generated query types
- `GET /api/health` health endpoint
- Production build that embeds the frontend and migrations in `dist/app`

## Run locally

```sh
bun install
bun run dev
```

Open http://localhost:3000. The local SQLite database is created at `data/calls.db`.

## Validate

```sh
bun run db:gen
bun run check:all
```

`db:gen` regenerates `src/db/queries.gen.ts` from the migrations and named SQL queries. `check:all` verifies the generated output, TypeScript, formatting, and lint rules. Run `bun run fix:codestyle` to apply the formatter and safe lint fixes.

## Deploy on Nibrun

Nibrun runs the compiled binary and provides an HTTPS URL plus a persistent `/app/data` volume. The application uses Nibrun's `NIBRUN_DATA_DIR`, so `calls.db` survives redeploys.

Build the Linux x64 binary:

```sh
bun run build
```

Create a new application:

```sh
nib run ./dist/app --name tanstack-start-nibrun --port 3000
```

Redeploy the existing application without replacing its persistent data:

```sh
nib run ./dist/app --app tanstack-start-nibrun-vjrd7d --port 3000
```

`nib run` waits for the service to become reachable and prints its URL. Check a deployment with:

```sh
curl -fsS https://tanstack-start-nibrun-vjrd7d.nibrun.app/api/health
```

### Agent skill

The [deploy-to-nibrun skill](https://github.com/ilbertt/nibrun/blob/main/skills/deploy-to-nibrun/SKILL.md) is vendored under `.agents/skills/`, so a coding agent working in this repository has the deploy commands, the guest contract and the tradeoffs without being told them. Refresh it with:

```sh
bunx skills add ilbertt/nibrun
```
