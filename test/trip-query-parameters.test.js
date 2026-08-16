const test = require('node:test');
const assert = require('node:assert/strict');

const {
    TripQueryValidationError,
    buildTripFilter,
    buildTripSort,
    isPossibleExactCode,
    parseTripQuery
} = require('../app_api/services/trip-query');

test('uses controlled defaults for an empty catalog query', () => {
    const criteria = parseTripQuery({});

    assert.equal(criteria.searchTerm, '');
    assert.equal(criteria.sortField, 'name');
    assert.equal(criteria.sortDirection, 'asc');
    assert.equal(criteria.page, 1);
    assert.equal(criteria.pageSize, 6);
});

test('parses supported database filters, sorting, and pagination', () => {
    const criteria = parseTripQuery({
        searchTerm: ' reef ',
        resort: ' Emerald Bay ',
        minPrice: '500.25',
        maxPrice: '1500',
        earliestStart: '2026-08-01',
        latestStart: '2026-08-31',
        minNights: '3',
        maxNights: '7',
        sortField: 'price',
        sortDirection: 'desc',
        page: '2',
        pageSize: '3'
    });

    assert.equal(criteria.searchTerm, 'reef');
    assert.equal(criteria.resort, 'Emerald Bay');
    assert.equal(criteria.minPrice, 500.25);
    assert.equal(criteria.maxNights, 7);
    assert.equal(criteria.earliestStart.toISOString(), '2026-08-01T00:00:00.000Z');
    assert.equal(criteria.latestStart.toISOString(), '2026-08-31T23:59:59.999Z');
    assert.equal(criteria.sortField, 'price');
    assert.equal(criteria.sortDirection, 'desc');
    assert.equal(criteria.page, 2);
    assert.equal(criteria.pageSize, 3);
});

test('rejects arrays and objects instead of accepting query operators', () => {
    assert.throws(
        () => parseTripQuery({ minPrice: { $gte: 0 } }),
        (error) => error instanceof TripQueryValidationError &&
            error.message === 'minPrice must contain one scalar value.'
    );

    assert.throws(
        () => parseTripQuery({ sortField: ['name', 'price'] }),
        TripQueryValidationError
    );
});

test('enforces sort and page-size allowlists', () => {
    assert.throws(
        () => parseTripQuery({ sortField: 'description' }),
        /sortField must be one of name, price, start/
    );
    assert.throws(
        () => parseTripQuery({ sortDirection: 'sideways' }),
        /sortDirection must be one of asc, desc/
    );
    assert.throws(
        () => parseTripQuery({ pageSize: '4' }),
        /pageSize must be 3, 6, or 9/
    );
});

test('rejects reversed numeric and date ranges', () => {
    assert.throws(
        () => parseTripQuery({ minPrice: '900', maxPrice: '500' }),
        /Minimum price cannot be greater than maximum price/
    );
    assert.throws(
        () => parseTripQuery({ minNights: '8', maxNights: '4' }),
        /Minimum nights cannot be greater than maximum nights/
    );
    assert.throws(
        () => parseTripQuery({
            earliestStart: '2026-09-02',
            latestStart: '2026-09-01'
        }),
        /Earliest departure cannot be later than latest departure/
    );
});

test('rejects invalid dates and noninteger night values', () => {
    assert.throws(
        () => parseTripQuery({ earliestStart: '2026-02-30' }),
        /must be a real calendar date/
    );
    assert.throws(
        () => parseTripQuery({ minNights: '3.5' }),
        /must be a whole number/
    );
});

test('limits text length and page depth', () => {
    assert.throws(
        () => parseTripQuery({ searchTerm: 'x'.repeat(81) }),
        /cannot exceed 80 characters/
    );
    assert.throws(
        () => parseTripQuery({ page: '100001' }),
        /page must be a whole number between 1 and 100000/
    );
});

test('builds an exact-code filter with database ranges', () => {
    const criteria = parseTripQuery({
        resort: 'Emerald Bay',
        minPrice: '500',
        maxPrice: '1000',
        minNights: '3',
        latestStart: '2026-12-31'
    });
    const filter = buildTripFilter(criteria, 'indexed-code', 'GALR210');

    assert.deepEqual(filter, {
        code: 'GALR210',
        resort: 'Emerald Bay',
        perPerson: { $gte: 500, $lte: 1000 },
        start: { $lte: new Date('2026-12-31T23:59:59.999Z') },
        nights: { $gte: 3 }
    });
});

test('builds a database text filter without copying raw query objects', () => {
    const criteria = parseTripQuery({ searchTerm: 'reef escape' });
    const filter = buildTripFilter(criteria, 'database-text');

    assert.deepEqual(filter, { $text: { $search: 'reef escape' } });
});

test('maps public sort names to indexed MongoDB fields with a direction-aligned code tie-breaker', () => {
    const criteria = parseTripQuery({
        sortField: 'price',
        sortDirection: 'desc'
    });

    assert.deepEqual(buildTripSort(criteria), { perPerson: -1, code: -1 });
});

test('recognizes only normalized values that can be complete trip codes', () => {
    assert.equal(isPossibleExactCode(' galr210 '), true);
    assert.equal(isPossibleExactCode('reef escape'), false);
    assert.equal(isPossibleExactCode('$where'), false);
});
