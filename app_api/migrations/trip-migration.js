const {
    TRIP_CODE_PATTERN,
    extractNights,
    hasAtMostTwoDecimalPlaces,
    normalizeTripCode,
    parseMoney
} = require('../utils/trip-values');

const transformLegacyTrip = (document) => {
    const code = normalizeTripCode(document.code);
    const perPerson = parseMoney(document.perPerson);
    const nights = Number.isInteger(document.nights)
        ? document.nights
        : extractNights(document.length);
    const errors = [];

    if (!code) {
        errors.push('missing trip code');
    } else if (code.length > 20 || !TRIP_CODE_PATTERN.test(code)) {
        errors.push('invalid normalized trip code');
    }
    if (
        !Number.isFinite(perPerson) ||
        perPerson < 0 ||
        perPerson > 100000 ||
        !hasAtMostTwoDecimalPlaces(perPerson)
    ) {
        errors.push('invalid per-person price');
    }
    if (!Number.isInteger(nights) || nights < 1 || nights > 365) {
        errors.push('invalid or unparseable number of nights');
    }

    return {
        id: document._id,
        originalCode: document.code,
        errors,
        transformed: {
            code,
            perPerson,
            nights
        }
    };
};

const analyzeLegacyTrips = (documents) => {
    const migrationTime = new Date();
    const rows = documents.map((document) => ({
        ...transformLegacyTrip(document),
        createdAt: document.createdAt || migrationTime,
        updatedAt: migrationTime
    }));
    const codeOwners = new Map();

    for (const row of rows) {
        if (!row.transformed.code) {
            continue;
        }

        const existingOwner = codeOwners.get(row.transformed.code);
        if (existingOwner) {
            row.errors.push(`duplicate normalized code also used by ${existingOwner}`);
        } else {
            codeOwners.set(row.transformed.code, String(row.id));
        }
    }

    return {
        rows,
        errors: rows.filter((row) => row.errors.length > 0),
        operations: rows.map((row) => ({
            updateOne: {
                filter: { _id: row.id },
                update: {
                    $set: {
                        code: row.transformed.code,
                        perPerson: row.transformed.perPerson,
                        nights: row.transformed.nights,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                }
            }
        }))
    };
};

module.exports = {
    analyzeLegacyTrips,
    transformLegacyTrip
};
