const Trip = require('../models/travlr');

const normalizeText = (value) => typeof value === 'string' ? value.trim() : value;
const normalizeTripCode = (value) => normalizeText(value) || '';

const tripPayload = (body, code = body.code) => ({
    code: normalizeTripCode(code),
    name: normalizeText(body.name),
    length: normalizeText(body.length),
    start: body.start,
    resort: normalizeText(body.resort),
    perPerson: normalizeText(body.perPerson),
    image: normalizeText(body.image),
    description: normalizeText(body.description)
});

const sendDatabaseError = (res, error, fallbackMessage) => {
    if (error?.name === 'ValidationError' || error?.name === 'CastError') {
        return res.status(400).json({ message: 'The trip data is invalid.' });
    }

    if (error?.code === 11000) {
        return res.status(409).json({ message: 'A trip with that code already exists.' });
    }

    return res.status(500).json({ message: fallbackMessage });
};

const tripsList = async (_req, res) => {
    try {
        const trips = await Trip.find({}).exec();
        return res.status(200).json(trips);
    } catch (error) {
        return sendDatabaseError(res, error, 'Trips could not be retrieved.');
    }
};

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
    normalizeTripCode,
    tripPayload,
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip
};
