# Travlr Milestone Three Artifact Package

## Package structure

- `Original_Artifact/travlr`: the completed Milestone Two artifact before the new algorithms and data structures work
- `Enhanced_Artifact/travlr`: the Milestone Three source code, tests, and demonstration data
- `ALGORITHM_COMPLEXITY.md`: the selected structures, algorithm steps, complexity, and design trade-offs
- `VERIFICATION_CHECKLIST.md`: automated and browser checks for the final local verification

Generated dependencies, build output, editor files, repository metadata, and `.env` are excluded from both copies.

## Enhancement scope

This milestone focuses on algorithms and data structures in the Angular administrative trip catalog. Database-side filtering, MongoDB pagination, migration work, and query indexes remain reserved for Milestone Four.

### Data structures

- Adds a normalized `Map<string, Trip>` index for exact trip-code lookup.
- Uses an ordered `Trip[]` for filtering, deterministic sorting, and pagination.
- Uses `Set<string>` while constructing unique resort filter options.
- Adds typed query criteria and result models so the component and service share one explicit contract.

### Algorithms

- Adds case-insensitive text search across trip code, name, resort, and plain description text.
- Selects the indexed lookup path when the complete trip code is supplied.
- Applies resort, price, departure-date, and trip-length filters in one pass.
- Sorts by name, price, or departure date in either direction.
- Uses normalized trip code as a deterministic tie-breaker.
- Keeps malformed prices and dates at the end of sorted results.
- Calculates page count, clamps invalid pages, and extracts only the requested page.
- Preserves the original source array while sorting a copied result set.

### Interface and verification support

- Adds accessible controls for search, filtering, sorting, page size, reset, and navigation.
- Reports the visible result range and whether search used the index or a catalog scan.
- Shows trip code and departure date on each card to make ordering and lookup behavior visible.
- Adds controlled messages for invalid ranges and no matching results.
- Expands the seed catalog to 12 varied records so filtering, sorting, and pagination can be repeated.
- Adds focused service and component tests for normal, boundary, and malformed-data scenarios.
