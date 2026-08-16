const {
    TRIP_CODE_PATTERN,
    normalizeTripCode
} = require('../utils/trip-values');

const ALLOWED_PAGE_SIZES = new Set([3, 6, 9]);
const SORT_FIELDS = Object.freeze({
    name: 'name',
    price: 'perPerson',
    start: 'start'
});
const SORT_DIRECTIONS = new Set(['asc', 'desc']);
const MAX_SEARCH_LENGTH = 80;
const MAX_PAGE = 100000;

class TripQueryValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TripQueryValidationError';
        this.status = 400;
    }
}

const readScalar = (query, key) => {
    const value = query?.[key];

    if (value === undefined || value === null) {
        return undefined;
    }

    if (Array.isArray(value) || typeof value === 'object') {
        throw new TripQueryValidationError(`${key} must contain one scalar value.`);
    }

    return String(value).trim();
};

const parseText = (query, key, maximumLength) => {
    const value = readScalar(query, key);
    if (!value) {
        return '';
    }

    if (value.length > maximumLength) {
        throw new TripQueryValidationError(
            `${key} cannot exceed ${maximumLength} characters.`
        );
    }

    return value;
};

const parseOptionalNumber = (
    query,
    key,
    { minimum = 0, maximum = Number.MAX_SAFE_INTEGER, integer = false } = {}
) => {
    const value = readScalar(query, key);
    if (value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new TripQueryValidationError(`${key} must be a valid number.`);
    }
    if (integer && !Number.isInteger(parsed)) {
        throw new TripQueryValidationError(`${key} must be a whole number.`);
    }
    if (parsed < minimum || parsed > maximum) {
        throw new TripQueryValidationError(
            `${key} must be between ${minimum} and ${maximum}.`
        );
    }

    return parsed;
};

const parsePositiveInteger = (query, key, defaultValue, maximum = MAX_PAGE) => {
    const value = readScalar(query, key);
    if (value === undefined || value === '') {
        return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
        throw new TripQueryValidationError(
            `${key} must be a whole number between 1 and ${maximum}.`
        );
    }

    return parsed;
};

const parseDateOnly = (query, key, endOfDay = false) => {
    const value = readScalar(query, key);
    if (value === undefined || value === '') {
        return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new TripQueryValidationError(`${key} must use YYYY-MM-DD format.`);
    }

    const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    const parsed = new Date(`${value}${suffix}`);
    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value
    ) {
        throw new TripQueryValidationError(`${key} must be a real calendar date.`);
    }

    return parsed;
};

const parseEnum = (query, key, allowedValues, defaultValue) => {
    const value = readScalar(query, key);
    if (value === undefined || value === '') {
        return defaultValue;
    }

    if (!allowedValues.has(value)) {
        throw new TripQueryValidationError(
            `${key} must be one of ${Array.from(allowedValues).join(', ')}.`
        );
    }

    return value;
};

const validateOrderedRange = (minimum, maximum, message) => {
    if (minimum !== null && maximum !== null && minimum > maximum) {
        throw new TripQueryValidationError(message);
    }
};

const parseTripQuery = (query = {}) => {
    const searchTerm = parseText(query, 'searchTerm', MAX_SEARCH_LENGTH);
    const resort = parseText(query, 'resort', 100);
    const minPrice = parseOptionalNumber(query, 'minPrice', {
        minimum: 0,
        maximum: 100000
    });
    const maxPrice = parseOptionalNumber(query, 'maxPrice', {
        minimum: 0,
        maximum: 100000
    });
    const earliestStart = parseDateOnly(query, 'earliestStart');
    const latestStart = parseDateOnly(query, 'latestStart', true);
    const minNights = parseOptionalNumber(query, 'minNights', {
        minimum: 1,
        maximum: 365,
        integer: true
    });
    const maxNights = parseOptionalNumber(query, 'maxNights', {
        minimum: 1,
        maximum: 365,
        integer: true
    });
    const sortField = parseEnum(
        query,
        'sortField',
        new Set(Object.keys(SORT_FIELDS)),
        'name'
    );
    const sortDirection = parseEnum(
        query,
        'sortDirection',
        SORT_DIRECTIONS,
        'asc'
    );
    const page = parsePositiveInteger(query, 'page', 1);
    const pageSize = parsePositiveInteger(query, 'pageSize', 6, 9);

    if (!ALLOWED_PAGE_SIZES.has(pageSize)) {
        throw new TripQueryValidationError('pageSize must be 3, 6, or 9.');
    }

    validateOrderedRange(
        minPrice,
        maxPrice,
        'Minimum price cannot be greater than maximum price.'
    );
    validateOrderedRange(
        minNights,
        maxNights,
        'Minimum nights cannot be greater than maximum nights.'
    );
    if (
        earliestStart !== null &&
        latestStart !== null &&
        earliestStart > latestStart
    ) {
        throw new TripQueryValidationError(
            'Earliest departure cannot be later than latest departure.'
        );
    }

    return {
        searchTerm,
        resort,
        minPrice,
        maxPrice,
        earliestStart,
        latestStart,
        minNights,
        maxNights,
        sortField,
        sortDirection,
        page,
        pageSize
    };
};

const addRange = (filter, field, minimum, maximum) => {
    if (minimum === null && maximum === null) {
        return;
    }

    filter[field] = {};
    if (minimum !== null) {
        filter[field].$gte = minimum;
    }
    if (maximum !== null) {
        filter[field].$lte = maximum;
    }
};

const buildTripFilter = (criteria, searchMode, exactCode = '') => {
    const filter = {};

    if (searchMode === 'indexed-code') {
        filter.code = exactCode;
    } else if (searchMode === 'database-text') {
        filter.$text = { $search: criteria.searchTerm };
    }

    if (criteria.resort) {
        filter.resort = criteria.resort;
    }

    addRange(filter, 'perPerson', criteria.minPrice, criteria.maxPrice);
    addRange(filter, 'start', criteria.earliestStart, criteria.latestStart);
    addRange(filter, 'nights', criteria.minNights, criteria.maxNights);

    return filter;
};

const buildTripSort = (criteria) => {
    const databaseField = SORT_FIELDS[criteria.sortField] || SORT_FIELDS.name;
    const direction = criteria.sortDirection === 'desc' ? -1 : 1;

    return {
        [databaseField]: direction,
        code: direction
    };
};

const isPossibleExactCode = (searchTerm) => {
    const normalized = normalizeTripCode(searchTerm);
    return (
        normalized.length > 0 &&
        normalized.length <= 20 &&
        TRIP_CODE_PATTERN.test(normalized)
    );
};

const executeQuery = async (query) => query.exec();

const createTripQueryService = (TripModel) => {
    const resolveSearch = async (criteria) => {
        if (!criteria.searchTerm) {
            return { searchMode: 'none', exactCode: '' };
        }

        if (isPossibleExactCode(criteria.searchTerm)) {
            const exactCode = normalizeTripCode(criteria.searchTerm);
            const match = await executeQuery(TripModel.exists({ code: exactCode }));
            if (match) {
                return { searchMode: 'indexed-code', exactCode };
            }
        }

        return { searchMode: 'database-text', exactCode: '' };
    };

    const queryTrips = async (rawQuery = {}) => {
        const criteria = parseTripQuery(rawQuery);
        const { searchMode, exactCode } = await resolveSearch(criteria);
        const filter = buildTripFilter(criteria, searchMode, exactCode);
        const sort = buildTripSort(criteria);
        const totalItems = await executeQuery(TripModel.countDocuments(filter));
        const totalPages = totalItems === 0
            ? 0
            : Math.ceil(totalItems / criteria.pageSize);
        const page = totalPages === 0
            ? 1
            : Math.min(criteria.page, totalPages);
        const skip = (page - 1) * criteria.pageSize;

        const items = await TripModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(criteria.pageSize)
            .lean()
            .exec();

        return {
            items,
            totalItems,
            totalPages,
            page,
            pageSize: criteria.pageSize,
            startItem: totalItems === 0 ? 0 : skip + 1,
            endItem: totalItems === 0
                ? 0
                : Math.min(skip + criteria.pageSize, totalItems),
            searchMode
        };
    };

    const listResorts = async () => {
        const values = await executeQuery(TripModel.distinct('resort'));
        const uniqueValues = new Map();

        for (const value of values) {
            const resort = String(value ?? '').trim();
            const key = resort.toLocaleLowerCase('en-US');
            if (key && !uniqueValues.has(key)) {
                uniqueValues.set(key, resort);
            }
        }

        return Array.from(uniqueValues.values()).sort((first, second) =>
            first.localeCompare(second, 'en-US', {
                sensitivity: 'base',
                numeric: true
            })
        );
    };

    return { queryTrips, listResorts };
};

module.exports = {
    ALLOWED_PAGE_SIZES,
    MAX_SEARCH_LENGTH,
    SORT_FIELDS,
    TripQueryValidationError,
    buildTripFilter,
    buildTripSort,
    createTripQueryService,
    isPossibleExactCode,
    parseTripQuery
};
