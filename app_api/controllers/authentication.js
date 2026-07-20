const passport = require('passport');
const User = require('../models/user');

const login = (req, res, next) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Authentication service is not configured.' });
    }

    return passport.authenticate('local', (error, user, info) => {
        if (error) {
            return next(error);
        }

        if (!user) {
            return res.status(401).json({
                message: info?.message || 'Authentication failed.'
            });
        }

        return res.status(200).json({ token: user.generateJWT() });
    })(req, res, next);
};

const register = async (req, res) => {
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Authentication service is not configured.' });
    }

    try {
        const user = new User({
            name: req.body.name.trim(),
            email: req.body.email.trim().toLowerCase(),
            password: ''
        });
        user.setPassword(req.body.password);
        await user.save();

        return res.status(201).json({ token: user.generateJWT() });
    } catch (error) {
        if (error?.name === 'ValidationError') {
            return res.status(400).json({ message: 'The account data is invalid.' });
        }

        if (error?.code === 11000) {
            return res.status(409).json({ message: 'An account with that email already exists.' });
        }

        return res.status(500).json({ message: 'The account could not be created.' });
    }
};

module.exports = { register, login };
