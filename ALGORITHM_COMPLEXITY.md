# Algorithms and Data Structures Notes

Let `n` represent the number of trips loaded into the Angular catalog and `m` represent the number of trips that remain after filtering.

| Operation | Structure or technique | Time complexity | Additional space | Design reason |
|---|---|---:|---:|---|
| Catalog initialization | Array copy and `Map` construction | O(n) | O(n) | Builds a reusable exact-code index while retaining ordered trip data. |
| Unique resort collection | `Set` plus ordered array | O(n) before sorting | O(r) | Removes repeated resort values, where `r` is the number of unique resorts. |
| Resort option sorting | `Intl.Collator` comparator | O(r log r) | O(r) | Produces a predictable interface order. |
| Exact trip-code search | `Map.get` | O(1) average | O(1) per lookup | Avoids scanning all trips when a complete code is supplied. |
| Partial text search | One scan over searchable fields | O(n) | O(m) | Supports code, name, resort, and description matching without interpreting user input as a regular expression. |
| Combined filtering | One predicate pass | O(n) | O(m) | Evaluates all active filters together instead of creating several intermediate arrays. |
| Result sorting | Copied array and comparator | O(m log m) | O(m) | Preserves the original array and supports deterministic ordering. |
| Pagination | Arithmetic and `slice` | O(p) | O(p) | Returns only `p` records for the selected page after filtering and sorting. |

## Main trade-offs

The `Map` index requires O(n) additional memory, but exact-code lookups become O(1) on average after a single O(n) initialization pass. Partial text search still requires O(n) because any searchable field may contain the requested text. This is appropriate for the current client-side milestone and makes the algorithm visible in the application. Milestone Four can move large-catalog filtering, pagination, and index use into MongoDB without changing the user-facing query model.

Sorting occurs after filtering so the O(m log m) cost is applied only to matching records. Invalid dates and prices are not silently converted into misleading values. They remain visible when no corresponding range filter is active, but they are excluded when a valid comparison is required and placed after valid values during sorting.
