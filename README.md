# Travlr Getaways — CS 499 Final Enhanced Artifact

Travlr is a full-stack travel application originally created in CS 465 and enhanced during CS 499 across Software Design and Engineering, Algorithms and Data Structures, and Databases. The final application combines an Express and Handlebars public site, a REST API backed by MongoDB and Mongoose, and an Angular administrative single-page application.

## Final artifact status

This folder represents the verified Milestone Four state used as the final enhanced technical artifact. It preserves the earlier software engineering improvements, replaces the Milestone Three in-memory catalog processing with validated MongoDB query execution, and includes repeatable server, database, API, and Angular verification materials.

Final recorded evidence includes:

- 42 passing server tests
- 46 passing Angular tests across 17 specification files in the student's final local verification
- successful Angular production build in the student's final local verification
- 12 of 12 stored trip documents validated
- numeric BSON storage confirmed for `perPerson` and `nights`
- 7 of 7 required named MongoDB indexes verified
- 5 of 5 representative database query scenarios passed
- 7 of 7 HTTP API smoke checks passed
- browser verification for protected editing, database-backed catalog operations, controlled validation feedback, and persistent updates

The included JSON reports in `verification/` were generated from the local MongoDB-backed application on August 1, 2026. The server suite was also re-run successfully during final technical cleanup.

## Architecture

- `app_server` — public Express routes, controllers, and Handlebars views
- `app_api` — authentication and trip APIs, Mongoose models, JWT middleware, database query service, migration logic, and verification scripts
- `app_admin` — Angular administrative SPA
- `data` — demonstration trip data used by the seed script
- `public` — static assets for the public site
- `test` — server-side automated tests
- `verification` — saved server, database, API, and static-verification evidence

## Enhancement progression

### Enhancement One — Software Design and Engineering

The administrator workflow was strengthened through protected Angular routes, return-to-route login behavior, route-parameter-based editing, reusable form construction and validation, user-facing loading and error states, normalized values, consistent API responses, fail-closed JWT middleware, safer password comparison, and targeted automated tests.

### Enhancement Two — Algorithms and Data Structures

Milestone Three introduced a typed in-memory catalog layer using an ordered array, a normalized `Map` for average O(1) exact-code lookup, a `Set` for unique resorts, one-pass filtering, deterministic sorting, range validation, and page extraction. That implementation is preserved in the milestone history and demonstrates structure selection, complexity reasoning, and algorithmic trade-offs.

### Enhancement Three — Databases

The final artifact moves active catalog work into MongoDB. It introduces numeric `perPerson` storage, an explicit integer `nights` field, stricter schema rules, a dry-run-first migration with backup, seven named indexes, validated scalar query parsing, exact-code and database-text search paths, server-side filtering and deterministic sorting, `countDocuments`, `skip`, `limit`, `lean`, and a database `distinct` endpoint for resort options. The Angular administrator consumes the paginated response contract directly.

## Local setup

1. Create local configuration from the safe template:

   ```bash
   cp .env.example .env
   ```

2. Replace `JWT_SECRET` with a long random value. Keep `.env` local and never commit or submit it. Confirm that MongoDB is running.

3. Install and start the Express application:

   ```bash
   npm ci
   npm run seed
   npm start
   ```

   The seed command replaces the current `trips` collection with the 12 demonstration records in `data/trips.json`. Do not seed first if preserving a legacy Milestone Three database for migration evidence.

4. In a second terminal, install and start the Angular client:

   ```bash
   cd app_admin
   npm ci
   npm start
   ```

The Express application uses `http://localhost:3000`, and the Angular client uses `http://localhost:4200`.

## Tests and verification

From the project root:

```bash
npm test
npm run verify:database
```

With the Express server running:

```bash
npm run verify:api
```

From `app_admin`:

```bash
npm run typecheck
npm run typecheck:tests
npm test -- --watch=false
npm run build
```

The full Angular test/build commands require a Node version supported by the installed Angular CLI. The saved final milestone record documents 46 passing Angular tests and a successful production build.

## Migration

For an existing legacy Milestone Three collection, begin with the non-destructive analysis:

```bash
npm run migrate:trips
```

After reviewing the preflight output, apply the migration:

```bash
npm run migrate:trips:apply
```

Apply mode creates a timestamped backup before modifying documents, synchronizes the final index definitions, verifies BSON field types, and validates the migrated records. See `MIGRATION_GUIDE.md` and `LOCAL_DATABASE_VERIFICATION.md`.

## Security and publication hygiene

The public/submission copy intentionally excludes local `.env` files, dependency folders, Angular cache, compiled build output, nested Git metadata, and operating-system metadata. `.env.example` documents only the required variable names and placeholder values. Authentication remains enforced on protected server operations, and database query construction accepts validated scalar values rather than raw query objects.

## Documentation map

- `DATABASE_ENHANCEMENT.md` — final database enhancement design and status
- `MIGRATION_GUIDE.md` — safe migration procedure
- `DATABASE_QUERY_GUIDE.md` — query parameters and response contract
- `ANGULAR_DATABASE_INTEGRATION.md` — Angular-to-database integration
- `PHASE3_VERIFICATION.md` — Angular integration verification record
- `PHASE4_VERIFICATION.md` — final database/API verification record
- `LOCAL_DATABASE_VERIFICATION.md` — reproduction procedure and screenshot checklist
- `verification/README.md` — saved evidence files
