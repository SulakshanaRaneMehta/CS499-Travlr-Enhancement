require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const Trip = require('./travlr');
const { getDatabaseUri } = require('./database-config');

const dataPath = path.join(__dirname, '../../data/trips.json');
const trips = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const seedDatabase = async () => {
    try {
        await mongoose.connect(getDatabaseUri());
        await Trip.deleteMany({});
        await Trip.insertMany(trips);
        const removedIndexes = await Trip.syncIndexes();

        console.log(`Seeded ${trips.length} trips.`);
        console.log(
            removedIndexes.length > 0
                ? `Removed obsolete indexes: ${removedIndexes.join(', ')}`
                : 'Database indexes are synchronized.'
        );
    } catch (error) {
        console.error('Database seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

seedDatabase();
