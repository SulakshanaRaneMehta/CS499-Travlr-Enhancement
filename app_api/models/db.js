const mongoose = require('mongoose');
const readline = require('readline');
const { getDatabaseUri } = require('./database-config');

const dbURI = getDatabaseUri();

const connect = async () => {
    if (mongoose.connection.readyState !== 0) {
        return mongoose.connection;
    }

    try {
        await mongoose.connect(dbURI);
        return mongoose.connection;
    } catch (error) {
        console.error('Mongoose connection failed:', error.message);
        throw error;
    }
};

mongoose.connection.on('connected', () => {
    console.log(`Mongoose connected to ${dbURI}`);
});
mongoose.connection.on('error', (error) => {
    console.error('Mongoose connection error:', error.message);
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

if (process.platform === 'win32') {
    const input = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    input.on('SIGINT', () => process.emit('SIGINT'));
}

const gracefulShutdown = async (message) => {
    await mongoose.connection.close();
    console.log(`Mongoose disconnected through ${message}`);
};

process.once('SIGUSR2', async () => {
    await gracefulShutdown('nodemon restart');
    process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
    await gracefulShutdown('app termination');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await gracefulShutdown('app shutdown');
    process.exit(0);
});

connect().catch(() => {
    process.exitCode = 1;
});
require('./travlr');

module.exports = mongoose;
module.exports.connect = connect;
module.exports.dbURI = dbURI;
