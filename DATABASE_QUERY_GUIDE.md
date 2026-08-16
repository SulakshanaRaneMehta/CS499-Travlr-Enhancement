# Database Query API Guide

## Catalog endpoint

`GET /api/trips` now returns a paginated query result rather than loading the complete collection into browser memory.

Supported query parameters are listed below.

| Parameter | Accepted value |
| --- | --- |
| `searchTerm` | Text up to 80 characters |
| `resort` | Exact resort value up to 100 characters |
| `minPrice`, `maxPrice` | Number from 0 through 100000 |
| `earliestStart`, `latestStart` | Date in `YYYY-MM-DD` format |
| `minNights`, `maxNights` | Whole number from 1 through 365 |
| `sortField` | `name`, `price`, or `start` |
| `sortDirection` | `asc` or `desc` |
| `page` | Whole number from 1 through 100000 |
| `pageSize` | `3`, `6`, or `9` |

Example request:

```text
GET /api/trips?searchTerm=reef&minPrice=700&maxPrice=1600&sortField=price&sortDirection=desc&page=1&pageSize=3
```

Example response contract:

```json
{
  "items": [],
  "totalItems": 0,
  "totalPages": 0,
  "page": 1,
  "pageSize": 3,
  "startItem": 0,
  "endItem": 0,
  "searchMode": "database-text"
}
```

`searchMode` is `none`, `indexed-code`, or `database-text`. A complete code is normalized and checked against the unique code index. Other search text is passed as a scalar string to the MongoDB text index. The service constructs the database filter itself and never copies raw query objects into MongoDB operations.

## Resort options endpoint

`GET /api/trips/resorts` obtains resort values with MongoDB `distinct`, removes blank or case-duplicate values, and returns an alphabetical list.

```json
{
  "resorts": ["Blue Lagoon", "Emerald Bay"]
}
```

## Query execution order

1. Parse and validate scalar parameters.
2. Reject unsupported sort fields, directions, page sizes, malformed dates, invalid ranges, and nested query objects.
3. Check whether a search value resolves through the unique trip-code index.
4. Construct the MongoDB filter and deterministic sort definition.
5. Run `countDocuments` to calculate page boundaries.
6. Clamp the requested page to the valid range.
7. Run `find`, `sort`, `skip`, `limit`, and `lean` to return only the requested records.

The Angular administrator is connected to this response contract through `TripDataService` and `TripListingComponent`. The browser consumes one database page plus server-calculated metadata rather than loading and processing the complete collection.
