const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createCatalogHandlers
} = require('../app_api/controllers/trips');
const {
    TripQueryValidationError
} = require('../app_api/services/trip-query');

const createResponse = () => {
    const state = { status: null, body: null };
    const response = {
        status(value) {
            state.status = value;
            return response;
        },
        json(value) {
            state.body = value;
            return response;
        }
    };

    return { response, state };
};

test('catalog controller returns the database query result', async () => {
    const expected = {
        items: [{ code: 'GALR210' }],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        pageSize: 6,
        startItem: 1,
        endItem: 1,
        searchMode: 'indexed-code'
    };
    const handlers = createCatalogHandlers({
        queryTrips: async (query) => {
            assert.deepEqual(query, { searchTerm: 'GALR210' });
            return expected;
        },
        listResorts: async () => []
    });
    const { response, state } = createResponse();

    await handlers.tripsList({ query: { searchTerm: 'GALR210' } }, response);

    assert.equal(state.status, 200);
    assert.deepEqual(state.body, expected);
});

test('catalog controller returns a controlled 400 query-validation response', async () => {
    const handlers = createCatalogHandlers({
        queryTrips: async () => {
            throw new TripQueryValidationError('pageSize must be 3, 6, or 9.');
        },
        listResorts: async () => []
    });
    const { response, state } = createResponse();

    await handlers.tripsList({ query: { pageSize: '4' } }, response);

    assert.equal(state.status, 400);
    assert.deepEqual(state.body, { message: 'pageSize must be 3, 6, or 9.' });
});

test('resort controller wraps database values in a stable response contract', async () => {
    const handlers = createCatalogHandlers({
        queryTrips: async () => ({}),
        listResorts: async () => ['Blue Lagoon', 'Emerald Bay']
    });
    const { response, state } = createResponse();

    await handlers.tripsListResorts({}, response);

    assert.equal(state.status, 200);
    assert.deepEqual(state.body, {
        resorts: ['Blue Lagoon', 'Emerald Bay']
    });
});
