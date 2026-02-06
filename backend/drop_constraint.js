require('dotenv').config();
const sequelize = require('./src/config/database');

async function dropConstraint() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Drop the unique constraint on userId
        await sequelize.query('ALTER TABLE events DROP CONSTRAINT IF EXISTS "events_userId_key";');
        console.log('✅ Dropped events_userId_key constraint');

        // Also try the other common name just in case
        await sequelize.query('ALTER TABLE events DROP CONSTRAINT IF EXISTS "events_userId_unique";');
        console.log('✅ Dropped events_userId_unique constraint');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error dropping constraint:', error);
        process.exit(1);
    }
}

dropConstraint();
