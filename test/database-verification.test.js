const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EXPECTED_INDEXES,
    auditIndexDefinitions,
    extractIndexNames,
    sameOrderedObject,
    sameUnorderedObject
} = require('../app_api/verification/database-verification');

const completeIndexList = () => [
    { name: '_id_', key: { _id: 1 } },
    { name: 'uniq_trip_code', key: { code: 1 }, unique: true },
    { name: 'trip_name_code', key: { name: 1, code: 1 } },
    { name: 'trip_price_code', key: { perPerson: 1, code: 1 } },
    { name: 'trip_departure_code', key: { start: 1, code: 1 } },
    {
        name: 'trip_resort_price_code',
        key: { resort: 1, perPerson: 1, code: 1 }
    },
    { name: 'trip_nights_code', key: { nights: 1, code: 1 } },
    {
        name: 'trip_catalog_text',
        key: { _fts: 'text', _ftsx: 1 },
        weights: {
            description: 1,
            resort: 5,
            name: 8,
            code: 10
        }
    }
];

test('compares compound index key order exactly', () => {
    assert.equal(
        sameOrderedObject(
            { resort: 1, perPerson: 1, code: 1 },
            { resort: 1, perPerson: 1, code: 1 }
        ),
        true
    );
    assert.equal(
        sameOrderedObject(
            { perPerson: 1, resort: 1, code: 1 },
            { resort: 1, perPerson: 1, code: 1 }
        ),
        false
    );
});

test('compares text-index weights without depending on property order', () => {
    assert.equal(
        sameUnorderedObject(
            { description: 1, code: 10, name: 8, resort: 5 },
            EXPECTED_INDEXES.trip_catalog_text.textWeights
        ),
        true
    );
});

test('accepts the complete required MongoDB index set', () => {
    const result = auditIndexDefinitions(completeIndexList());

    assert.equal(result.passed, true);
    assert.equal(result.checks.length, 7);
    assert.equal(result.checks.every((check) => check.passed), true);
});

test('reports a missing or structurally incorrect index', () => {
    const indexes = completeIndexList().filter(
        (index) => index.name !== 'trip_nights_code'
    );
    const priceIndex = indexes.find((index) => index.name === 'trip_price_code');
    priceIndex.key = { code: 1, perPerson: 1 };

    const result = auditIndexDefinitions(indexes);
    const nights = result.checks.find((check) => check.name === 'trip_nights_code');
    const price = result.checks.find((check) => check.name === 'trip_price_code');

    assert.equal(result.passed, false);
    assert.match(nights.issues[0], /missing/);
    assert.match(price.issues[0], /key differs/);
});

test('extracts every named index from nested explain output', () => {
    const explain = {
        queryPlanner: {
            winningPlan: {
                stage: 'FETCH',
                inputStage: {
                    stage: 'IXSCAN',
                    indexName: 'uniq_trip_code'
                }
            },
            rejectedPlans: [
                {
                    stage: 'IXSCAN',
                    indexName: 'trip_name_code'
                }
            ]
        }
    };

    assert.deepEqual(
        Array.from(extractIndexNames(explain)).sort(),
        ['trip_name_code', 'uniq_trip_code']
    );
});
