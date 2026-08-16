# Trip Database Migration Guide

## Purpose

The existing Travlr collection stores prices as strings and embeds the number of nights inside display text. The version 2 migration converts prices to MongoDB numbers, creates the integer `nights` field, normalizes trip codes, and installs the indexes declared by the enhanced schema.

## Before running

1. Start MongoDB.
2. Configure `MONGODB_URI` or use `DB_HOST` and `DB_NAME` in a local `.env` file.
3. Keep `.env` outside the submitted ZIP. Use `.env.example` as the shareable template.
4. Confirm that the current collection is named `trips`.

## Dry run

```bash
npm run migrate:trips
```

No documents or indexes are changed. Resolve every reported preflight error before proceeding.

## Apply

```bash
npm run migrate:trips:apply
```

The script creates a backup collection named `trips_backup_YYYYMMDDHHMMSS`, performs the update, synchronizes indexes, checks BSON field types, and validates all documents through Mongoose.

## Re-seeding a development database

```bash
npm run seed
```

The seed file already uses numeric prices and explicit night counts. Seeding deletes the current trip documents, inserts the 12 verification records, and synchronizes the index set.
