const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

const Trip = require('../models/travlr');
const { getDatabaseUri } = require('../models/database-config');
const { createTripQueryService } = require('../services/trip-query');

const EXPECTED_INDEXES = Object.freeze({
    uniq_trip_code: {
        key: { code: 1 },
        unique: true
    },
    trip_name_code: {
        key: { name: 1, code: 1 }
    },
    trip_price_code: {
        key: { perPerson: 1, code: 1 }
    },
    trip_departure_code: {
        key: { start: 1, code: 1 }
    },
    trip_resort_price_code: {
        key: { resort: 1, perPerson: 1, code: 1 }
    },
    trip_nights_code: {
        key: { nights: 1, code: 1 }
    },
    trip_catalog_text: {
        textWeights: {
            code: 10,
            name: 8,
            resort: 5,
            description: 1
        }
    }
});

const stableEntries = (value = {}) => Object.entries(value);

const sameOrderedObject = (actual, expected) =>
    JSON.stringify(stableEntries(actual)) === JSON.stringify(stableEntries(expected));

const sameUnorderedObject = (actual = {}, expected = {}) => {
    const actualEntries = Object.entries(actual).sort(([first], [second]) =>
        first.localeCompare(second)
    );
    const expectedEntries = Object.entries(expected).sort(([first], [second]) =>
        first.localeCompare(second)
    );
    return JSON.stringify(actualEntries) === JSON.stringify(expectedEntries);
};

const auditIndexDefinitions = (indexes, expectedIndexes = EXPECTED_INDEXES) => {
    const byName = new Map(indexes.map((index) => [index.name, index]));
    const checks = [];

    for (const [name, expected] of Object.entries(expectedIndexes)) {
        const actual = byName.get(name);
        const issues = [];

        if (!actual) {
            issues.push('index is missing');
        } else {
            if (expected.key && !sameOrderedObject(actual.key, expected.key)) {
                issues.push(
                    `key differs: expected ${JSON.stringify(expected.key)}, received ${JSON.stringify(actual.key)}`
                );
            }
            if (expected.unique === true && actual.unique !== true) {
                issues.push('index is not unique');
            }
            if (
                expected.textWeights &&
                !sameUnorderedObject(actual.weights, expected.textWeights)
            ) {
                issues.push(
                    `text weights differ: expected ${JSON.stringify(expected.textWeights)}, received ${JSON.stringify(actual.weights || {})}`
                );
            }
        }

        checks.push({
            name,
            passed: issues.length === 0,
            issues
        });
    }

    return {
        passed: checks.every((check) => check.passed),
        checks,
        observedNames: indexes.map((index) => index.name).sort()
    };
};

const extractIndexNames = (value, names = new Set()) => {
    if (Array.isArray(value)) {
        value.forEach((item) => extractIndexNames(item, names));
        return names;
    }

    if (!value || typeof value !== 'object') {
        return names;
    }

    if (typeof value.indexName === 'string') {
        names.add(value.indexName);
    }

    Object.values(value).forEach((item) => extractIndexNames(item, names));
    return names;
};

const describeExplain = (name, explain) => ({
    name,
    indexesObserved: Array.from(extractIndexNames(explain)).sort(),
    executionStats: explain.executionStats
        ? {
            nReturned: explain.executionStats.nReturned,
            totalKeysExamined: explain.executionStats.totalKeysExamined,
            totalDocsExamined: explain.executionStats.totalDocsExamined,
            executionTimeMillis: explain.executionStats.executionTimeMillis
        }
        : null
});

const auditStoredDocuments = async (TripModel, collection) => {
    const count = await TripModel.countDocuments({}).exec();
    const typeSummary = await collection.aggregate([
        {
            $group: {
                _id: {
                    perPerson: { $type: '$perPerson' },
                    nights: { $type: '$nights' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]).toArray();

    const duplicateCodes = await collection.aggregate([
        { $group: { _id: '$code', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { _id: 1 } }
    ]).toArray();

    const validationErrors = [];
    let validated = 0;

    for await (const trip of TripModel.find({}).cursor()) {
        try {
            await trip.validate();
            validated += 1;
        } catch (error) {
            validationErrors.push({
                id: String(trip._id),
                code: trip.code,
                message: error.message
            });
        }
    }

    const numericStorageOnly = typeSummary.every(
        (group) =>
            ['double', 'int', 'long', 'decimal'].includes(group._id.perPerson) &&
            ['double', 'int', 'long', 'decimal'].includes(group._id.nights)
    );

    return {
        passed:
            count > 0 &&
            validated === count &&
            validationErrors.length === 0 &&
            duplicateCodes.length === 0 &&
            numericStorageOnly,
        count,
        validated,
        typeSummary,
        duplicateCodes,
        numericStorageOnly,
        validationErrors
    };
};

const isAscending = (items, field) => {
    for (let index = 1; index < items.length; index += 1) {
        const previous = items[index - 1][field];
        const current = items[index][field];
        if (previous > current) {
            return false;
        }
    }
    return true;
};

const isDescending = (items, field) => {
    for (let index = 1; index < items.length; index += 1) {
        const previous = items[index - 1][field];
        const current = items[index][field];
        if (previous < current) {
            return false;
        }
    }
    return true;
};

const verifyQueryScenarios = async (TripModel) => {
    const service = createTripQueryService(TripModel);
    const firstTrip = await TripModel.findOne({}).sort({ code: 1 }).lean().exec();

    if (!firstTrip) {
        return {
            passed: false,
            scenarios: [{ name: 'catalog availability', passed: false, details: 'No trip records exist.' }]
        };
    }

    const defaultPage = await service.queryTrips({
        page: '1',
        pageSize: '3',
        sortField: 'name',
        sortDirection: 'asc'
    });
    const exactCode = await service.queryTrips({
        searchTerm: firstTrip.code.toLowerCase(),
        pageSize: '3'
    });
    const priceSort = await service.queryTrips({
        page: '1',
        pageSize: '3',
        sortField: 'price',
        sortDirection: 'desc'
    });
    const textSearch = await service.queryTrips({
        searchTerm: 'reef',
        page: '1',
        pageSize: '9',
        sortField: 'name',
        sortDirection: 'asc'
    });
    const combinedFilter = await service.queryTrips({
        resort: firstTrip.resort,
        minPrice: '0',
        maxPrice: '100000',
        minNights: '1',
        maxNights: '365',
        pageSize: '9',
        sortField: 'price',
        sortDirection: 'asc'
    });

    const scenarios = [
        {
            name: 'database pagination',
            passed:
                defaultPage.totalItems > 0 &&
                defaultPage.items.length <= 3 &&
                defaultPage.page === 1 &&
                isAscending(defaultPage.items, 'name'),
            details: defaultPage
        },
        {
            name: 'unique-index exact-code lookup',
            passed:
                exactCode.searchMode === 'indexed-code' &&
                exactCode.totalItems === 1 &&
                exactCode.items[0]?.code === firstTrip.code,
            details: exactCode
        },
        {
            name: 'numeric price sorting',
            passed:
                priceSort.items.length > 0 &&
                isDescending(priceSort.items, 'perPerson'),
            details: priceSort
        },
        {
            name: 'MongoDB text search',
            passed:
                textSearch.searchMode === 'database-text' &&
                textSearch.totalItems > 0,
            details: textSearch
        },
        {
            name: 'combined resort and numeric ranges',
            passed:
                combinedFilter.totalItems > 0 &&
                combinedFilter.items.every(
                    (trip) =>
                        trip.resort === firstTrip.resort &&
                        trip.perPerson >= 0 &&
                        trip.perPerson <= 100000 &&
                        trip.nights >= 1 &&
                        trip.nights <= 365
                ),
            details: combinedFilter
        }
    ];

    return {
        passed: scenarios.every((scenario) => scenario.passed),
        scenarios
    };
};

const collectExplainEvidence = async (collection, firstTrip) => {
    const evidence = [];

    const exactCode = await collection
        .find({ code: firstTrip.code })
        .limit(1)
        .explain('executionStats');
    evidence.push(describeExplain('exact code lookup', exactCode));

    const priceSort = await collection
        .find({})
        .sort({ perPerson: -1, code: -1 })
        .limit(3)
        .explain('executionStats');
    evidence.push(describeExplain('price sort and page extraction', priceSort));

    const resortPrice = await collection
        .find({
            resort: firstTrip.resort,
            perPerson: { $gte: 0, $lte: 100000 }
        })
        .sort({ perPerson: 1, code: 1 })
        .limit(9)
        .explain('executionStats');
    evidence.push(describeExplain('resort and price filter', resortPrice));

    const nightsRange = await collection
        .find({ nights: { $gte: 1, $lte: 365 } })
        .sort({ nights: 1, code: 1 })
        .limit(9)
        .explain('executionStats');
    evidence.push(describeExplain('nights range filter', nightsRange));

    const textSearch = await collection
        .find({ $text: { $search: 'reef' } })
        .limit(9)
        .explain('executionStats');
    evidence.push(describeExplain('catalog text search', textSearch));

    return evidence;
};

const writeReport = (report, outputPath) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
};

const runDatabaseVerification = async ({
    TripModel = Trip,
    connection = mongoose.connection,
    outputPath = path.join(
        __dirname,
        '../../verification/database-verification-report.json'
    )
} = {}) => {
    const collection = connection.collection(TripModel.collection.collectionName);
    const indexes = await collection.listIndexes().toArray();
    const indexAudit = auditIndexDefinitions(indexes);
    const documentAudit = await auditStoredDocuments(TripModel, collection);
    const queryAudit = await verifyQueryScenarios(TripModel);
    const firstTrip = await TripModel.findOne({}).sort({ code: 1 }).lean().exec();
    const explainEvidence = firstTrip
        ? await collectExplainEvidence(collection, firstTrip)
        : [];

    const report = {
        generatedAt: new Date().toISOString(),
        database: connection.name,
        collection: collection.collectionName,
        passed: indexAudit.passed && documentAudit.passed && queryAudit.passed,
        indexAudit,
        documentAudit,
        queryAudit,
        explainEvidence
    };

    writeReport(report, outputPath);
    return { report, outputPath };
};

const main = async () => {
    const uri = getDatabaseUri();
    await mongoose.connect(uri);

    try {
        const { report, outputPath } = await runDatabaseVerification();
        console.log(`Database: ${report.database}`);
        console.log(`Collection: ${report.collection}`);
        console.log(`Documents validated: ${report.documentAudit.validated}/${report.documentAudit.count}`);
        console.log(`Required indexes verified: ${report.indexAudit.checks.filter((check) => check.passed).length}/${report.indexAudit.checks.length}`);
        console.log(`Query scenarios passed: ${report.queryAudit.scenarios.filter((scenario) => scenario.passed).length}/${report.queryAudit.scenarios.length}`);

        for (const evidence of report.explainEvidence) {
            const indexes = evidence.indexesObserved.length > 0
                ? evidence.indexesObserved.join(', ')
                : 'no named index reported';
            console.log(`Explain ${evidence.name}: ${indexes}`);
        }

        console.log(`Report written to: ${outputPath}`);
        console.log(report.passed ? 'Database verification passed.' : 'Database verification failed.');

        if (!report.passed) {
            process.exitCode = 1;
        }
    } finally {
        await mongoose.connection.close();
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error('Database verification failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = {
    EXPECTED_INDEXES,
    auditIndexDefinitions,
    describeExplain,
    extractIndexNames,
    runDatabaseVerification,
    sameOrderedObject,
    sameUnorderedObject
};
