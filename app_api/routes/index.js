const express = require('express');
const router = express.Router();

const tripController = require('../controllers/trips');
const authController = require('../controllers/authentication');
const { authenticateJWT } = require('../middleware/auth');

router.route('/trips')
    .get(tripController.tripsList)
    .post(authenticateJWT, tripController.tripsAddTrip);

router.route('/trips/resorts')
    .get(tripController.tripsListResorts);

router.route('/login').post(authController.login);
router.route('/register').post(authController.register);

router.route('/trips/:tripCode')
    .get(tripController.tripsFindByCode)
    .put(authenticateJWT, tripController.tripsUpdateTrip);

module.exports = router;
