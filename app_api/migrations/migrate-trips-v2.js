require('dotenv').config();

const mongoose = require('mongoose');
const Trip = require('../models/travlr');
const { getDatabaseUri } = require('../models/database-config');
const { analyzeLegacyTrips } = require('./trip-migration');

const applyChanges = process.argv.includes('--apply');

const backupCollectionName = () => {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    return `trips_backup_${stamp}`;
};

const addSchemaPreflightErrors = async (analysis, documents) => {
    for (let index = 0; index < analysis.rows.length; index += 1) {
        const row = analysis.rows[index];

        try {
            const candidate = new Trip({
                ...documents[index],
                ...row.transformed,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            });

            await candidate.validate();
        } catch (error) {
            if (error.errors) {
                const details = Object.values(error.errors)
                    .map((validationError) => validationError.message)
                    .join(', ');

                row.errors.push(`schema validation failed: ${details}`);
            } else {
                row.errors.push(`schema construction failed: ${error.message}`);
            }
        }
    }
};

const errorRows = (analysis) =>
    analysis.rows.filter((row) => row.errors.length > 0);

const printPreflight = (analysis, documentCount) => {
    const errors = errorRows(analysis);

    console.log(`Migration mode: ${applyChanges ? 'APPLY' : 'DRY RUN'}`);
    console.log(`Documents inspected: ${documentCount}`);
    console.log(`Documents ready: ${analysis.rows.length - errors.length}`);
    console.log(`Documents with errors: ${errors.length}`);

    for (const row of errors) {
        console.error(
            `- ${row.originalCode || row.id}: ${row.errors.join('; ')}`
        );
    }
};

const verifyMigratedDocuments = async (collection) => {
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

    let validated = 0;
    for await (const trip of Trip.find({}).cursor()) {
        await trip.validate();
        validated += 1;
    }

    console.log(`Mongoose documents validated: ${validated}`);
    console.log('Stored BSON type summary:');
    for (const group of typeSummary) {
        console.log(
            `- perPerson=${group._id.perPerson}, nights=${group._id.nights}: ${group.count}`
        );
    }
};

const migrate = async () => {
    const uri = getDatabaseUri();
    await mongoose.connect(uri);

    const collection = mongoose.connection.collection(Trip.collection.collectionName);
    const documents = await collection.find({}).toArray();
    const analysis = analyzeLegacyTrips(documents);
    await addSchemaPreflightErrors(analysis, documents);

    printPreflight(analysis, documents.length);

    if (errorRows(analysis).length > 0) {
        throw new Error('Migration stopped because preflight validation failed.');
    }

    if (!applyChanges) {
        console.log('No data was changed. Run npm run migrate:trips:apply to apply the migration.');
        return;
    }

    const backupName = backupCollectionName();
    await mongoose.connection.createCollection(backupName);
    if (documents.length > 0) {
        await mongoose.connection.collection(backupName).insertMany(documents);
    }
    console.log(`Backup created: ${backupName}`);

    if (analysis.operations.length > 0) {
        const result = await collection.bulkWrite(analysis.operations, { ordered: true });
        console.log(`Documents modified: ${result.modifiedCount}`);
    }

    const removedIndexes = await Trip.syncIndexes();
    console.log(
        removedIndexes.length > 0
            ? `Obsolete indexes removed: ${removedIndexes.join(', ')}`
            : 'No obsolete indexes required removal.'
    );

    await verifyMigratedDocuments(collection);
    console.log('Trip database migration completed successfully.');
};

migrate()
    .catch((error) => {
        console.error('Trip database migration failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });
