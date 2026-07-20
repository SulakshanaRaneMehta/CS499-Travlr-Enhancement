const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.get('authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    const [scheme, token, extra] = authHeader.trim().split(/\s+/);
    if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
        return res.status(401).json({ message: 'A valid bearer token is required.' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Authentication service is not configured.' });
    }

    try {
        req.auth = jwt.verify(token, process.env.JWT_SECRET);
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }
};

module.exports = { authenticateJWT };
