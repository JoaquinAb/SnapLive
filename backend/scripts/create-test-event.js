/**
 * Script temporal: crea un evento de prueba para el usuario indicado
 * sin requerir pago (isPaid=true, isActive=true).
 *
 * Uso: node scripts/create-test-event.js
 */
require('dotenv').config();
const sequelize = require('../src/config/database');
const User      = require('../src/models/User');
const Event     = require('../src/models/Event');

const TARGET_EMAIL = 'joaquinabreu14@hotmail.com';

const EVENT_DATA = {
    name:      'Evento de Prueba QR',
    type:      'other',
    eventDate: '2026-12-31',
    isPaid:    true,
    isActive:  true,
};

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos\n');

        // Buscar usuario
        const user = await User.findOne({ where: { email: TARGET_EMAIL } });
        if (!user) {
            console.error(`❌ No se encontró ningún usuario con email: ${TARGET_EMAIL}`);
            process.exit(1);
        }
        console.log(`👤 Usuario encontrado: ${user.name || user.email} (ID: ${user.id})`);

        // Crear evento
        const event = await Event.create({
            ...EVENT_DATA,
            userId: user.id,
        });

        console.log('\n🎉 Evento creado exitosamente:');
        console.log(`   Nombre : ${event.name}`);
        console.log(`   Slug   : ${event.slug}`);
        console.log(`   Tipo   : ${event.type}`);
        console.log(`   Fecha  : ${event.eventDate}`);
        console.log(`   isPaid : ${event.isPaid}`);
        console.log(`   URL    : http://localhost:3000/event/${event.slug}`);
        console.log('\n✅ Listo. Actualizá el dashboard en el navegador.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await sequelize.close();
    }
})();
