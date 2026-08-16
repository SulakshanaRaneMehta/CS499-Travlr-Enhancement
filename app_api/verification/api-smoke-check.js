const fs = require('node:fs');
const path = require('node:path');

const baseUrl = (process.env.API_BASE_URL || 'http://localhost:3000/api')
    .replace(/\/$/, '');
const exactCode = process.env.VERIFY_TRIP_CODE || 'GALR210214';
const outputPath = path.join(
    __dirname,
    '../../verification/api-smoke-test-report.json'
);

const fetchJson = async (relativeUrl) => {
    const response = await fetch(`${baseUrl}${relativeUrl}`);
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    return {
        url: `${baseUrl}${relativeUrl}`,
        status: response.status,
        body
    };
};

const check = (name, response, predicate) => {
    let passed = false;
    let error = '';

    try {
        passed = Boolean(predicate(response));
    } catch (caught) {
        error = caught.message;
    }

    return {
        name,
        passed,
        status: response.status,
        url: response.url,
        error,
        response: response.body
    };
};

const run = async () => {
    const encodedCode = encodeURIComponent(exactCode.toLowerCase());
    const encodedResort = encodeURIComponent('Emerald Bay, 3 stars');

    const responses = await Promise.all([
        fetchJson('/trips?page=1&pageSize=3&sortField=name&sortDirection=asc'),
        fetchJson(`/trips?searchTerm=${encodedCode}&pageSize=3`),
        fetchJson('/trips?searchTerm=reef&page=1&pageSize=9&sortField=name&sortDirection=asc'),
        fetchJson(`/trips?resort=${encodedResort}&minPrice=700&maxPrice=1700&minNights=4&maxNights=8&sortField=price&sortDirection=asc&page=1&pageSize=9`),
        fetchJson('/trips?page=2&pageSize=3&sortField=name&sortDirection=asc'),
        fetchJson('/trips?minPrice=2000&maxPrice=1000'),
        fetchJson('/trips/resorts')
    ]);

    const results = [
        check('default database page', responses[0], ({ status, body }) =>
            status === 200 &&
            Array.isArray(body.items) &&
            body.items.length <= 3 &&
            body.totalItems > 0 &&
            body.page === 1 &&
            body.pageSize === 3
        ),
        check('lowercase exact-code lookup', responses[1], ({ status, body }) =>
            status === 200 &&
            body.searchMode === 'indexed-code' &&
            body.totalItems === 1 &&
            body.items[0]?.code === exactCode.toUpperCase()
        ),
        check('database text search', responses[2], ({ status, body }) =>
            status === 200 &&
            body.searchMode === 'database-text' &&
            body.totalItems > 0
        ),
        check('combined database filters', responses[3], ({ status, body }) =>
            status === 200 &&
            body.totalItems > 0 &&
            body.items.every((trip) =>
                trip.resort === 'Emerald Bay, 3 stars' &&
                trip.perPerson >= 700 &&
                trip.perPerson <= 1700 &&
                trip.nights >= 4 &&
                trip.nights <= 8
            )
        ),
        check('database page two', responses[4], ({ status, body }) =>
            status === 200 &&
            body.page === 2 &&
            body.startItem === 4 &&
            body.items.length > 0 &&
            body.items.length <= 3
        ),
        check('controlled invalid-range response', responses[5], ({ status, body }) =>
            status === 400 &&
            typeof body.message === 'string' &&
            body.message.includes('Minimum price')
        ),
        check('database resort options', responses[6], ({ status, body }) =>
            status === 200 &&
            Array.isArray(body.resorts) &&
            body.resorts.length > 0
        )
    ];

    const report = {
        generatedAt: new Date().toISOString(),
        baseUrl,
        passed: results.every((result) => result.passed),
        results
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    for (const result of results) {
        console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name} (${result.status})`);
    }
    console.log(`Report written to: ${outputPath}`);

    if (!report.passed) {
        process.exitCode = 1;
    }
};

run().catch((error) => {
    console.error('API smoke test failed:', error.message);
    console.error(`Confirm that the Express server is running at ${baseUrl}.`);
    process.exitCode = 1;
});
