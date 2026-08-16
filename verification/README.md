# Verification Evidence

This folder contains saved evidence for the final CS 499 Travlr database enhancement.

## Included reports

### `database-verification-report.json`

Generated from the local MongoDB-backed application on August 1, 2026. It records document integrity, BSON field types, duplicate-code checks, the seven required named indexes, representative database query scenarios, and MongoDB `explain` evidence. The report records `passed: true`.

### `api-smoke-test-report.json`

Generated against the running local Express API on August 1, 2026. It records seven HTTP checks for the primary catalog query paths and records `passed: true`.

### `server-test-result.txt`

Saved output from the final 42-test Node server suite. The recorded result is 42 passed and 0 failed.

### `static-javascript-check.txt`

Saved static JavaScript syntax verification. The recorded result is passed.

## Reproduce the evidence

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

The Angular test/build commands require a Node version supported by the installed Angular CLI.

Reports should be regenerated after changes to the schema, migration logic, indexes, query service, seed data, API contract, or dependencies. Published evidence should always describe the same code version that appears in the final artifact.
