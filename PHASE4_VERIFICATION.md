# Phase 4 Database Verification

Phase 4 provides repeatable verification for the MongoDB enhancement. The scripts complement browser testing by producing structured evidence that can be retained with the milestone narrative and ePortfolio.

## Automated server verification

From the root of the enhanced project:

```bash
npm test
```

Final result:

```text
42 tests passed
0 tests failed
```

The final suite covers authentication middleware, normalization, migration preflight behavior, schema validation, query-parameter validation, controlled query construction, exact-code lookup, text search, deterministic sorting, database pagination, controller responses, public-site query handling, resort options, and MongoDB index definitions.

Five Phase 4 tests specifically verify the required MongoDB index definitions, compound-key order, unique-index configuration, text-index weights, and extraction of named indexes from nested `explain` output.

## Database verification

Run:

```bash
npm run verify:database
```

The command is read-only with respect to stored trip data. It checks:

- stored document count
- Mongoose validation for every trip
- numeric BSON storage for `perPerson` and `nights`
- duplicate normalized trip codes
- all seven required named indexes
- unique configuration of `uniq_trip_code`
- compound-index field order
- text-index weights
- database pagination
- lowercase exact-code lookup
- numeric price sorting
- MongoDB text search
- combined database filtering
- index names observed in MongoDB `explain('executionStats')`

The included report is:

```text
verification/database-verification-report.json
```

Final recorded result from August 1, 2026:

```text
passed: true
12 / 12 documents validated
7 / 7 required named indexes verified
5 / 5 representative database query scenarios passed
numericStorageOnly: true
0 duplicate normalized trip codes
```

The report documents indexes observed in the selected query plans without treating a particular optimizer choice as an unconditional requirement. For very small development collections, MongoDB may reasonably select a collection scan even when an intended index is available.

## API smoke verification

With the Express application running, execute:

```bash
npm run verify:api
```

The smoke check verifies:

- first database page and metadata
- lowercase exact-code lookup
- MongoDB text search
- combined resort/price/night filtering
- second-page extraction
- controlled HTTP 400 handling for an invalid price range
- database-backed resort options

The included report is:

```text
verification/api-smoke-test-report.json
```

Final recorded result from August 1, 2026:

```text
passed: true
7 / 7 HTTP checks passed
```

A different existing code can be supplied without changing the script:

```bash
VERIFY_TRIP_CODE=ANOTHER_CODE npm run verify:api
```

A different API location can be supplied with:

```bash
API_BASE_URL=http://localhost:3000/api npm run verify:api
```

## Index-direction review

The trip-code secondary key follows the primary sort direction. For example, descending price sorting uses:

```javascript
{ perPerson: -1, code: -1 }
```

The ascending compound index `{ perPerson: 1, code: 1 }` can support both forward traversal and complete reverse traversal. This preserves deterministic ordering without adding duplicate ascending and descending index definitions that would increase storage and write cost.

## Evidence status

Unlike the earlier preparation-stage documentation, the final technical package includes the completed local database and API JSON reports. Regenerate them whenever the schema, query service, indexes, seed data, or API behavior changes so that published evidence remains synchronized with the code.
