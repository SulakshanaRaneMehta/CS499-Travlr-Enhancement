# Angular Database Integration

Phase 3 connects the Angular administrator catalog directly to the validated MongoDB query API introduced in Phase 2. The browser no longer downloads the complete collection and no longer performs active catalog filtering, sorting, counting, or page extraction in its memory.

## Request Contract

`TripDataService.getTrips` accepts typed `TripQueryCriteria` and converts only the supported scalar values into HTTP query parameters. Empty optional values are omitted. Sorting and pagination values are always sent so the server receives an explicit request contract.

Supported criteria are:

- `searchTerm`
- `resort`
- `minPrice` and `maxPrice`
- `earliestStart` and `latestStart`
- `minNights` and `maxNights`
- `sortField` and `sortDirection`
- `page` and `pageSize`

The service receives a `TripQueryResult` containing one page of results and metadata calculated by the server. This metadata includes the total number of records, the number of pages, the visible range, and the search path.

## Catalog Component Flow

`TripListingComponent` sends the current criteria to the API during initial loading, filter submission, clearing, changes to the page size, and numbered page navigation. It uses the returned metadata rather than calculating totals in the browser.

The component also requests resort choices from `/api/trips/resorts`. This endpoint operates independently of the current result page, so the resort selector represents the complete database collection rather than only the trips visible on the screen.

A request identifier that increases with every request prevents a slower earlier response from replacing a newer result. Client validation blocks obvious invalid ranges before a request is sent, while validation performed by the server remains authoritative. An HTTP 400 response from the server is displayed as filter feedback without removing the last valid result page.

## Database Search Evidence in the Interface

The API reports one of three search modes. The literal values below remain unchanged because they are part of the response contract:

- `none` when no search term is active
- `indexed-code` when a normalized complete code is found through the unique index
- `database-text` when MongoDB text search is used

The Angular result summary identifies the database path used for the two active search modes. This makes the database execution strategy visible without exposing internal MongoDB filter objects.

## Forms Aligned with the Database

The Angular `Trip` model now includes numeric `perPerson` values and integer `nights` values. The add and edit forms contain a dedicated field for the number of nights and validate the same principal limits as the Mongoose schema. `TripFormService` trims text, normalizes the code, and converts the price and number of nights into numeric values before sending them to the API.

The former `TripCatalogService`, which processed the catalog in browser memory, and its unused static trip data were removed from the enhanced artifact. The complete Milestone Three implementation remains preserved in `Original_Artifact` for comparison.

## Verification Commands

From `app_admin`:

```bash
npm run typecheck
npm run typecheck:tests
npm test -- --watch=false
npm run build
```

The type checks validate the application TypeScript, Angular templates, and test TypeScript. The test and build commands should be run with the Node version required by the installed Angular CLI.