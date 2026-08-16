const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTripCode, tripPayload } = require('../app_api/controllers/trips');

const exampleTrip = (overrides = {}) => ({
    code: ' SUNS260910 ',
    name: ' Sunset Cove ',
    length: ' 3 nights / 4 days ',
    start: '2026-09-10',
    resort: ' Azure Bay, 4 stars ',
    perPerson: '899.00',
    image: ' reef1.jpg ',
    description: ' A coastal getaway. ',
    ...overrides
});

test('normalizes route trip codes to uppercase', () => {
    assert.equal(normalizeTripCode('  suns260910  '), 'SUNS260910');
});

test('trims text fields and converts database values in trip payloads', () => {
    const payload = tripPayload(exampleTrip());

    assert.equal(payload.code, 'SUNS260910');
    assert.equal(payload.name, 'Sunset Cove');
    assert.equal(payload.image, 'reef1.jpg');
    assert.equal(payload.perPerson, 899);
    assert.equal(payload.nights, 3);
});

test('uses an explicit whole-number nights value when supplied', () => {
    const payload = tripPayload(exampleTrip({ nights: 5 }));
    assert.equal(payload.nights, 5);
});

test('marks malformed database values as invalid numbers for schema validation', () => {
    const payload = tripPayload(exampleTrip({ perPerson: '89.999', length: 'weekend' }));
    assert.equal(Number.isNaN(payload.perPerson), true);
    assert.equal(Number.isNaN(payload.nights), true);
});
