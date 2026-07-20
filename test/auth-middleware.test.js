const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { authenticateJWT } = require('../app_api/middleware/auth');

const createResponse = () => ({
    statusCode: 200,
    body: undefined,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

test.beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
});

test.afterEach(() => {
    delete process.env.JWT_SECRET;
});

test('rejects requests without an authorization header', () => {
    const req = { get: () => undefined };
    const res = createResponse();
    let continued = false;

    authenticateJWT(req, res, () => { continued = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Authentication required.');
    assert.equal(continued, false);
});

test('rejects a malformed bearer header', () => {
    const req = { get: () => 'Basic credentials' };
    const res = createResponse();

    authenticateJWT(req, res, () => assert.fail('Request should not continue.'));

    assert.equal(res.statusCode, 401);
});

test('rejects an expired token without continuing', () => {
    const token = jwt.sign({ email: 'traveler@example.com' }, 'test-secret', {
        expiresIn: -1
    });
    const req = { get: () => `Bearer ${token}` };
    const res = createResponse();
    let continued = false;

    authenticateJWT(req, res, () => { continued = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
});

test('accepts a valid token and attaches its payload', () => {
    const token = jwt.sign({ email: 'traveler@example.com' }, 'test-secret', {
        expiresIn: '1h'
    });
    const req = { get: () => `Bearer ${token}` };
    const res = createResponse();
    let continued = false;

    authenticateJWT(req, res, () => { continued = true; });

    assert.equal(continued, true);
    assert.equal(req.auth.email, 'traveler@example.com');
    assert.equal(res.statusCode, 200);
});
