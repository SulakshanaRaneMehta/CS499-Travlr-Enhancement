# Local Database Verification Procedure

> Final evidence status: the submitted technical package already includes successful database and API reports generated on August 1, 2026. The procedures below are retained so another reviewer can reproduce the evidence after a clean install or after future code/data changes.


Use one of the two procedures below. The migration procedure provides stronger evidence when the existing local database still contains the Milestone Three structure.

## Path A: Preserve and Migrate the Existing Milestone Three Database

Do not run the seed command first. Seeding deletes the current `trips` collection and would remove the legacy records needed to demonstrate the migration.

1. Open a terminal in `Enhanced_Artifact/travlr`.

2. Create the local configuration file and install the required dependencies.

   ```bash
   cp .env.example .env
   npm ci
   ```

3. Replace the example `JWT_SECRET` value in `.env` and confirm that MongoDB is running.

4. Run the server tests.

   ```bash
   npm test
   ```

5. Perform the preliminary migration analysis without changing any data.

   ```bash
   npm run migrate:trips
   ```

6. Capture a screenshot showing the preliminary mode, the number of inspected records, the number of records ready for migration, and zero errors.

7. Apply the migration.

   ```bash
   npm run migrate:trips:apply
   ```

8. Capture the output that identifies the backup collection with its timestamp, the number of modified records, index synchronization, the BSON type summary, and successful document validation.

9. Run the database audit, which does not modify stored data.

   ```bash
   npm run verify:database
   ```

10. Retain `verification/database-verification-report.json` as evidence for the appendix.

## Path B: Create a Fresh Enhanced Development Database

Use this procedure when the legacy local database is unavailable.

1. Create the `.env` file, install the required dependencies, and confirm that MongoDB is running.

2. Seed the enhanced catalog containing twelve records.

   ```bash
   npm run seed
   ```

3. Run the database audit.

   ```bash
   npm run verify:database
   ```

The seed command replaces the current `trips` collection. It should not be used when the existing data must be preserved.

## API and Angular Verification

1. Start the Express application.

   ```bash
   npm start
   ```

2. Open a second terminal and run the API smoke verification.

   ```bash
   npm run verify:api
   ```

3. Open a third terminal and prepare the Angular client.

   ```bash
   cd app_admin
   npm ci
   npm test -- --watch=false
   npm run build
   npm start
   ```

4. Open `http://localhost:4200` and verify the catalog after logging in.

## Recommended Screenshot Set

Capture evidence for the following scenarios:

1. Preliminary migration analysis completed with no errors.

2. Applied migration showing the backup collection name and verification of BSON field types.

3. Database verification summary showing that all required indexes and query scenarios passed.

4. API smoke report showing that all seven checks passed.

5. Default catalog showing three of twelve records and numbered page navigation.

6. Exact trip code search with lowercase input and the MongoDB unique index message.

7. Text search with the MongoDB text index message.

8. Combined filters for price, date, and number of nights.

9. Numeric price sorting in descending order.

10. The second page showing records four through six.

11. Invalid reversed price range showing controlled feedback while preserving the previous valid catalog.

12. Add or edit form showing the explicit numeric fields for price and number of nights.

The JSON reports can support the appendix, but screenshots should focus on clear and readable evidence rather than displaying entire report files.