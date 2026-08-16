const getDatabaseUri = () => {
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }

    const host = process.env.DB_HOST || '127.0.0.1';
    const databaseName = process.env.DB_NAME || 'travlr';
    return `mongodb://${host}/${databaseName}`;
};

module.exports = { getDatabaseUri };
