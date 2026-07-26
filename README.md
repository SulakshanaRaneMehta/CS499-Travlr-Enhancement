# Travlr Getaways

Travlr is a full-stack travel application with an Express and Handlebars public site, a REST API backed by MongoDB and Mongoose, and an Angular administrative client.

## Architecture

- `app_server`: public Express routes, controllers, and Handlebars views
- `app_api`: trip and authentication API, Mongoose models, and JWT middleware
- `app_admin`: Angular administrative single-page application
- `data`: trip data used by the seed script
- `public`: static assets for the public site
- `test`: server-side tests

## Local setup

1. Create the server configuration:

   ```bash
   cp .env.example .env
   ```

2. Replace `JWT_SECRET` in `.env` with a long random value, keep `CLIENT_ORIGIN` aligned with the Angular URL, and confirm that MongoDB is running.

3. Install and start the Express application:

   ```bash
   npm ci
   npm run seed
   npm start
   ```

   The seed command replaces the current `trips` collection with the 12 demonstration records in `data/trips.json`.

4. In a second terminal, install and start the Angular client:

   ```bash
   cd app_admin
   npm ci
   npm start
   ```

The Express application uses `http://localhost:3000`, and the Angular client uses `http://localhost:4200`.

## Tests and build

Run the server tests from the project root:

```bash
npm test
```

Run the Angular tests and production build from `app_admin`:

```bash
npm test -- --watch=false
npm run build
```

## Algorithms and data structures enhancement

The Milestone Three enhancement adds a typed catalog query model and a dedicated `TripCatalogService`. A normalized `Map` provides average O(1) exact-code lookup after O(n) initialization. A `Set` supports unique resort collection, and ordered arrays support one-pass filtering, deterministic O(m log m) sorting, and page extraction. The Angular catalog now provides text search, resort and numeric ranges, departure dates, trip-length filters, six sort orders, three page sizes, range validation, result summaries, and controlled empty states.

Search input is treated as plain text rather than executable regular-expression syntax. Sorting copies the matching array, places malformed comparable values last, and uses trip code as a deterministic tie-breaker. Database-side filtering and MongoDB indexes remain reserved for the database enhancement.

## Existing software design enhancement

The completed Milestone Two work remains in place. It includes protected Angular routes, return-to-route login behavior, route-parameter-based editing, reusable form construction and validation, user-facing loading and error states, explicit asynchronous view synchronization, normalized trip values, schema safeguards, consistent API responses, corrected JWT enforcement, safer password comparison, and targeted automated tests.

Secrets belong only in `.env`. The repository includes `.env.example`, while `.env` is intentionally ignored and excluded from the submission package.
