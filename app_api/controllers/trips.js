const Trip = require('../models/travlr');
const {
    normalizeTripCode,
    tripPayload
} = require('../utils/trip-values');
const {
    TripQueryValidationError,
    createTripQueryService
} = require('../services/trip-query');

const tripQueryService = createTripQueryService(Trip);

const sendDatabaseError = (res, error, fallbackMessage) => {
    if (error instanceof TripQueryValidationError) {
        return res.status(error.status).json({ message: error.message });
    }

    if (
        error?.name === 'ValidationError' ||
        error?.name === 'CastError' ||
        error?.name === 'StrictModeError'
    ) {
        return res.status(400).json({ message: 'The trip data is invalid.' });
    }

    if (error?.code === 11000) {
        return res.status(409).json({ message: 'A trip with that code already exists.' });
    }

    return res.status(500).json({ message: fallbackMessage });
};

const createCatalogHandlers = (queryService) => ({
    tripsList: async (req, res) => {
        try {
            const result = await queryService.queryTrips(req.query);
            return res.status(200).json(result);
        } catch (error) {
            return sendDatabaseError(res, error, 'Trips could not be retrieved.');
        }
    },
    tripsListResorts: async (_req, res) => {
        try {
            const resorts = await queryService.listResorts();
            return res.status(200).json({ resorts });
        } catch (error) {
            return sendDatabaseError(
                res,
                error,
                'Resort options could not be retrieved.'
            );
        }
    }
});

const { tripsList, tripsListResorts } = createCatalogHandlers(tripQueryService);

const tripsFindByCode = async (req, res) => {
    try {
        const tripCode = normalizeTripCode(req.params.tripCode);
        const trip = await Trip.findOne({ code: tripCode }).exec();

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        return res.status(200).json(trip);
    } catch (error) {
        return sendDatabaseError(res, error, 'The trip could not be retrieved.');
    }
};

const tripsAddTrip = async (req, res) => {
    try {
        const trip = await Trip.create(tripPayload(req.body));
        return res.status(201).json(trip);
    } catch (error) {
        return sendDatabaseError(res, error, 'The trip could not be added.');
    }
};

const tripsUpdateTrip = async (req, res) => {
    try {
        const tripCode = normalizeTripCode(req.params.tripCode);
        const trip = await Trip.findOneAndUpdate(
            { code: tripCode },
            tripPayload(req.body, tripCode),
            { new: true, runValidators: true }
        ).exec();

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }

        return res.status(200).json(trip);
    } catch (error) {
        return sendDatabaseError(res, error, 'The trip could not be updated.');
    }
};

module.exports = {
    createCatalogHandlers,
    normalizeTripCode,
    tripPayload,
    tripsList,
    tripsListResorts,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip
};
