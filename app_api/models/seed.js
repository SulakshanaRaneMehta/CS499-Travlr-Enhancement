const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('./db');
const Trip = require('./travlr');

const dataPath = path.join(__dirname, '../../data/trips.json');
const trips = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const seedDatabase = async () => {
    try {
        await Trip.deleteMany({});
        await Trip.insertMany(trips);
        console.log(`Seeded ${trips.length} trips.`);
    } catch (error) {
        console.error('Database seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

seedDatabase();
