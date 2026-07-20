const mongoose = require('mongoose');
const readline = require('readline');

const host = process.env.DB_HOST || '127.0.0.1';
const dbURI = `mongodb://${host}/travlr`;

const connect = async () => {
    try {
        await mongoose.connect(dbURI);
    } catch (error) {
        console.error('Mongoose connection failed:', error.message);
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

setTimeout(connect, 1000);
require('./travlr');

module.exports = mongoose;
