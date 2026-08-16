const test = require('node:test');
const assert = require('node:assert/strict');

const { createTripQueryService } = require('../app_api/services/trip-query');

const resolvedQuery = (value) => ({
    exec: async () => value
});

const createModel = ({ exists = null, count = 0, items = [], resorts = [] } = {}) => {
    const trace = {
        existsFilters: [],
        countFilters: [],
        findFilters: [],
        sorts: [],
        skips: [],
        limits: [],
        distinctFields: []
    };

    const model = {
        exists(filter) {
            trace.existsFilters.push(filter);
            return resolvedQuery(exists);
        },
        countDocuments(filter) {
            trace.countFilters.push(filter);
            return resolvedQuery(count);
        },
        find(filter) {
            trace.findFilters.push(filter);
            const chain = {
                sort(value) {
                    trace.sorts.push(value);
                    return chain;
                },
                skip(value) {
                    trace.skips.push(value);
                    return chain;
                },
                limit(value) {
                    trace.limits.push(value);
                    return chain;
                },
                lean() {
                    return chain;
                },
                exec: async () => items
            };
            return chain;
        },
        distinct(field) {
            trace.distinctFields.push(field);
            return resolvedQuery(resorts);
        }
    };

    return { model, trace };
};

test('uses the unique code index for an existing normalized trip code', async () => {
    const { model, trace } = createModel({
        exists: { _id: 'trip-id' },
        count: 1,
        items: [{ code: 'GALR210' }]
    });
    const service = createTripQueryService(model);

    const result = await service.queryTrips({
        searchTerm: ' galr210 ',
        minPrice: '500',
        pageSize: '3'
    });

    assert.equal(result.searchMode, 'indexed-code');
    assert.deepEqual(trace.existsFilters, [{ code: 'GALR210' }]);
    assert.deepEqual(trace.countFilters[0], {
        code: 'GALR210',
        perPerson: { $gte: 500 }
    });
    assert.deepEqual(trace.findFilters[0], trace.countFilters[0]);
    assert.deepEqual(result.items, [{ code: 'GALR210' }]);
});

test('uses MongoDB text search when no exact code exists', async () => {
    const { model, trace } = createModel({
        exists: null,
        count: 2,
        items: [{ code: 'REEF100' }, { code: 'REEF200' }]
    });
    const service = createTripQueryService(model);

    const result = await service.queryTrips({
        searchTerm: 'reef',
        sortField: 'start',
        sortDirection: 'desc'
    });

    assert.equal(result.searchMode, 'database-text');
    assert.deepEqual(trace.countFilters[0], {
        $text: { $search: 'reef' }
    });
    assert.deepEqual(trace.sorts[0], { start: -1, code: -1 });
});

test('does not perform an exact-code probe for a multiword search', async () => {
    const { model, trace } = createModel({ count: 0, items: [] });
    const service = createTripQueryService(model);

    const result = await service.queryTrips({ searchTerm: 'island escape' });

    assert.equal(result.searchMode, 'database-text');
    assert.equal(trace.existsFilters.length, 0);
});

test('clamps a page after counting and applies skip and limit in MongoDB', async () => {
    const { model, trace } = createModel({
        count: 7,
        items: [{ code: 'LAST100' }]
    });
    const service = createTripQueryService(model);

    const result = await service.queryTrips({
        page: '9',
        pageSize: '3',
        sortField: 'name',
        sortDirection: 'asc'
    });

    assert.equal(result.page, 3);
    assert.equal(result.totalPages, 3);
    assert.equal(result.startItem, 7);
    assert.equal(result.endItem, 7);
    assert.deepEqual(trace.skips, [6]);
    assert.deepEqual(trace.limits, [3]);
});

test('returns a controlled empty-page summary', async () => {
    const { model, trace } = createModel({ count: 0, items: [] });
    const service = createTripQueryService(model);

    const result = await service.queryTrips({ page: '4', pageSize: '6' });

    assert.equal(result.page, 1);
    assert.equal(result.totalPages, 0);
    assert.equal(result.startItem, 0);
    assert.equal(result.endItem, 0);
    assert.deepEqual(trace.skips, [0]);
});

test('returns sorted case-insensitive resort options from the database', async () => {
    const { model, trace } = createModel({
        resorts: ['Sunset Cove', ' emerald bay ', 'Emerald Bay', '', null, 'Blue Lagoon']
    });
    const service = createTripQueryService(model);

    const resorts = await service.listResorts();

    assert.deepEqual(resorts, ['Blue Lagoon', 'emerald bay', 'Sunset Cove']);
    assert.deepEqual(trace.distinctFields, ['resort']);
});
