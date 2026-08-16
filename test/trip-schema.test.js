const test = require('node:test');
const assert = require('node:assert/strict');
const Trip = require('../app_api/models/travlr');

const validTrip = (overrides = {}) => ({
    code: 'test260101',
    name: 'Test Trip',
    length: '4 nights / 5 days',
    nights: 4,
    start: '2026-01-01',
    resort: 'Test Resort, 4 stars',
    perPerson: 799.5,
    image: 'reef1.jpg',
    description: 'A test trip.',
    ...overrides
});

test('casts valid database fields and normalizes the unique code', async () => {
    const trip = new Trip(validTrip());
    await trip.validate();

    assert.equal(trip.code, 'TEST260101');
    assert.equal(trip.perPerson, 799.5);
    assert.equal(trip.nights, 4);
});

test('rejects fractional nights', async () => {
    const trip = new Trip(validTrip({ nights: 4.5 }));
    await assert.rejects(trip.validate(), /whole number/);
});

test('rejects prices with more than two decimal places', async () => {
    const trip = new Trip(validTrip({ perPerson: 799.999 }));
    await assert.rejects(trip.validate(), /two decimal places/);
});
