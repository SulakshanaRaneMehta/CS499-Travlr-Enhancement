const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildPageUrl,
    fetchAllTrips
} = require('../app_server/controllers/travel');

test('public catalog requests a controlled database-sorted page', () => {
    const url = new URL(buildPageUrl(2));

    assert.equal(url.pathname, '/api/trips');
    assert.equal(url.searchParams.get('sortField'), 'name');
    assert.equal(url.searchParams.get('sortDirection'), 'asc');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('pageSize'), '9');
});

test('public catalog combines every database page before rendering', async () => {
    const requestedPages = [];
    const fetchImpl = async (url) => {
        const page = Number(new URL(url).searchParams.get('page'));
        requestedPages.push(page);
        const payloads = {
            1: { items: [{ code: 'A' }], totalPages: 3 },
            2: { items: [{ code: 'B' }], totalPages: 3 },
            3: { items: [{ code: 'C' }], totalPages: 3 }
        };

        return {
            ok: true,
            status: 200,
            json: async () => payloads[page]
        };
    };

    const trips = await fetchAllTrips(fetchImpl);

    assert.deepEqual(trips.map((trip) => trip.code), ['A', 'B', 'C']);
    assert.deepEqual(requestedPages, [1, 2, 3]);
});

test('public catalog rejects malformed API response contracts', async () => {
    const fetchImpl = async () => ({
        ok: true,
        status: 200,
        json: async () => []
    });

    await assert.rejects(
        () => fetchAllTrips(fetchImpl),
        /invalid catalog response/
    );
});
