require('dotenv').config();
const { User } = require('./src/models');
const sequelize = require('./src/config/database');

async function listUsers() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        console.log('\n👥 Registered Users:');
        console.table(users.map(u => ({
            ID: u.id,
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Joined: u.createdAt.toLocaleString()
        })));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing users:', error);
        process.exit(1);
    }
}

listUsers();
