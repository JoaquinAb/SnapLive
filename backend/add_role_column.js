require('dotenv').config();
const { sequelize } = require('./src/models');

async function addRoleColumn() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Check if column exists first (optional, but good practice)
        // For simplicity, we'll try to add it and catch error if it exists
        try {
            await sequelize.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
                        CREATE TYPE "enum_users_role" AS ENUM('user', 'admin');
                    END IF;
                END $$;
            `);
            console.log('✅ Enum type checked/created');

            await sequelize.query('ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT \'user\';');
            console.log('✅ Role column added successfully');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('ℹ️ Column or type already exists');
            } else {
                throw err;
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding role column:', error);
        process.exit(1);
    }
}

addRoleColumn();
