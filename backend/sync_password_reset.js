/**
 * Script para crear la tabla password_resets
 * Ejecutar: node sync_password_reset.js
 */
require('dotenv').config();
const sequelize = require('./src/config/database');
const PasswordReset = require('./src/models/PasswordReset');

async function syncTable() {
    try {
        console.log('🔄 Sincronizando tabla password_resets...');

        await PasswordReset.sync({ force: false });

        console.log('✅ Tabla password_resets creada/sincronizada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

syncTable();
