const test = require('node:test');
const assert = require('node:assert/strict');
const {
    analyzeLegacyTrips,
    transformLegacyTrip
} = require('../app_api/migrations/trip-migration');

test('transforms legacy string prices and derives nights from length', () => {
    const row = transformLegacyTrip({
        _id: 'trip-1',
        code: ' galr210214 ',
        perPerson: '799.00',
        length: '4 nights / 5 days'
    });

    assert.deepEqual(row.errors, []);
    assert.equal(row.transformed.code, 'GALR210214');
    assert.equal(row.transformed.perPerson, 799);
    assert.equal(row.transformed.nights, 4);
});

test('preflight rejects invalid legacy values', () => {
    const row = transformLegacyTrip({
        _id: 'trip-2',
        code: '',
        perPerson: 'price unavailable',
        length: 'extended stay'
    });

    assert.equal(row.errors.length, 3);
});

test('preflight detects codes that collide after normalization', () => {
    const analysis = analyzeLegacyTrips([
        { _id: 'one', code: 'reef1', perPerson: '500.00', length: '2 nights' },
        { _id: 'two', code: ' REEF1 ', perPerson: '600.00', length: '3 nights' }
    ]);

    assert.equal(analysis.errors.length, 1);
    assert.match(analysis.errors[0].errors.join(' '), /duplicate normalized code/);
});
