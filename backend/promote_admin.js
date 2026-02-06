require('dotenv').config();
const { User, sequelize } = require('./src/models');

const TARGET_EMAIL = 'joaquinabreu14@hotmail.com';

async function promoteAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        const user = await User.findOne({ where: { email: TARGET_EMAIL } });

        if (!user) {
            console.error(`❌ User not found with email: ${TARGET_EMAIL}`);
            console.log('Listing all users for reference:');
            const allUsers = await User.findAll({ attributes: ['id', 'email', 'name'] });
            console.table(allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`✅ Successfully promoted ${user.name} (${user.email}) to ADMIN.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error promoting admin:', error);
        process.exit(1);
    }
}

promoteAdmin();
