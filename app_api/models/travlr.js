const mongoose = require('mongoose');
const {
    TRIP_CODE_PATTERN,
    hasAtMostTwoDecimalPlaces,
    normalizeTripCode
} = require('../utils/trip-values');

const tripSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 20,
        match: TRIP_CODE_PATTERN,
        set: normalizeTripCode
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    length: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    nights: {
        type: Number,
        required: true,
        min: 1,
        max: 365,
        validate: {
            validator: Number.isInteger,
            message: 'Trip nights must be a whole number.'
        }
    },
    start: {
        type: Date,
        required: true
    },
    resort: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    perPerson: {
        type: Number,
        required: true,
        min: 0,
        max: 100000,
        validate: {
            validator: hasAtMostTwoDecimalPlaces,
            message: 'Per-person price may contain no more than two decimal places.'
        }
    },
    image: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
}, {
    strict: 'throw',
    timestamps: true
});

// Indexes correspond to the catalog's exact lookup, filtering, and deterministic sorting paths.
tripSchema.index({ code: 1 }, { unique: true, name: 'uniq_trip_code' });
tripSchema.index({ name: 1, code: 1 }, { name: 'trip_name_code' });
tripSchema.index({ perPerson: 1, code: 1 }, { name: 'trip_price_code' });
tripSchema.index({ start: 1, code: 1 }, { name: 'trip_departure_code' });
tripSchema.index(
    { resort: 1, perPerson: 1, code: 1 },
    { name: 'trip_resort_price_code' }
);
tripSchema.index({ nights: 1, code: 1 }, { name: 'trip_nights_code' });
tripSchema.index(
    { code: 'text', name: 'text', resort: 'text', description: 'text' },
    {
        name: 'trip_catalog_text',
        weights: { code: 10, name: 8, resort: 5, description: 1 }
    }
);

const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;
module.exports.hasAtMostTwoDecimalPlaces = hasAtMostTwoDecimalPlaces;
