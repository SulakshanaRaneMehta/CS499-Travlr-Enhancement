const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const NIGHTS_PATTERN = /(\d+)\s*nights?/i;
const TRIP_CODE_PATTERN = /^[A-Z0-9-]+$/;

const normalizeText = (value) => String(value ?? '').trim();

const normalizeTripCode = (value) =>
    normalizeText(value).toLocaleUpperCase('en-US');

const hasAtMostTwoDecimalPlaces = (value) =>
    Number.isFinite(value) &&
    Math.abs((value * 100) - Math.round(value * 100)) < 1e-8;

const parseMoney = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : Number.NaN;
    }

    const normalized = normalizeText(value);
    if (!MONEY_PATTERN.test(normalized)) {
        return Number.NaN;
    }

    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : Number.NaN;
};

const extractNights = (length) => {
    const match = normalizeText(length).match(NIGHTS_PATTERN);
    if (!match) {
        return Number.NaN;
    }

    const nights = Number(match[1]);
    return Number.isInteger(nights) ? nights : Number.NaN;
};

const parseNights = (value, length) => {
    if (value !== undefined && value !== null && normalizeText(value) !== '') {
        const nights = Number(value);
        return Number.isInteger(nights) ? nights : Number.NaN;
    }

    return extractNights(length);
};

const tripPayload = (body, code = body.code) => ({
    code: normalizeTripCode(code),
    name: normalizeText(body.name),
    length: normalizeText(body.length),
    nights: parseNights(body.nights, body.length),
    start: body.start,
    resort: normalizeText(body.resort),
    perPerson: parseMoney(body.perPerson),
    image: normalizeText(body.image),
    description: normalizeText(body.description)
});

module.exports = {
    MONEY_PATTERN,
    TRIP_CODE_PATTERN,
    hasAtMostTwoDecimalPlaces,
    extractNights,
    normalizeText,
    normalizeTripCode,
    parseMoney,
    parseNights,
    tripPayload
};
