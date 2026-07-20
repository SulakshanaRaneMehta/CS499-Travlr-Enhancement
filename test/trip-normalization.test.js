const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTripCode, tripPayload } = require('../app_api/controllers/trips');

test('normalizes route trip codes', () => {
    assert.equal(normalizeTripCode('  SUNS260910  '), 'SUNS260910');
});

test('trims text fields in trip payloads', () => {
    const payload = tripPayload({
        code: ' SUNS260910 ',
        name: ' Sunset Cove ',
        length: ' 3 nights / 4 days ',
        start: '2026-09-10',
        resort: ' Azure Bay, 4 stars ',
        perPerson: '899.00',
        image: ' reef1.jpg ',
        description: ' A coastal getaway. '
    });

    assert.equal(payload.code, 'SUNS260910');
    assert.equal(payload.name, 'Sunset Cove');
    assert.equal(payload.image, 'reef1.jpg');
});
