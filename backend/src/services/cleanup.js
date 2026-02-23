const { Op } = require('sequelize');
const { Event, Photo, User } = require('../models');
const ImageService = require('./image');
const { sendExpirationWarningEmail, sendPhotosDeletedEmail } = require('./email');

/**
 * Cleanup Service
 * Handles automatic deletion of photos 60 days after event date
 * and sends warning emails before deletion
 */

const DAYS_UNTIL_CLEANUP = 60;
const DAYS_WARNING_7 = DAYS_UNTIL_CLEANUP - 7; // 53 days after event
const DAYS_WARNING_1 = DAYS_UNTIL_CLEANUP - 1; // 59 days after event

/**
 * Get a date N days ago (at noon to avoid timezone issues)
 */
function getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0]; // DATEONLY format: YYYY-MM-DD
}

/**
 * Clean up photos for events that are past the expiration period
 * Deletes photos from Cloudinary/local storage and from the database
 */
async function cleanupExpiredPhotos() {
    const cutoffDate = getDateDaysAgo(DAYS_UNTIL_CLEANUP);

    console.log(`\n🧹 [Cleanup] Buscando eventos con fotos expiradas (antes de ${cutoffDate})...`);

    try {
        // Find events that:
        // 1. Have an eventDate older than 60 days
        // 2. Haven't been cleaned up yet (photosCleanedAt is null)
        const expiredEvents = await Event.findAll({
            where: {
                eventDate: { [Op.lte]: cutoffDate },
                photosCleanedAt: null
            },
            include: [
                { model: Photo, as: 'photos' },
                { model: User, as: 'user', attributes: ['email', 'name'] }
            ]
        });

        if (expiredEvents.length === 0) {
            console.log('🧹 [Cleanup] No hay eventos con fotos expiradas.');
            return { cleaned: 0, photosDeleted: 0 };
        }

        let totalPhotosDeleted = 0;

        for (const event of expiredEvents) {
            const photoCount = event.photos.length;

            if (photoCount > 0) {
                console.log(`🗑️ [Cleanup] Eliminando ${photoCount} fotos del evento "${event.name}" (${event.slug})...`);

                // Delete each photo from Cloudinary/local storage
                for (const photo of event.photos) {
                    try {
                        await ImageService.deletePhoto(photo.publicId);
                    } catch (err) {
                        console.error(`   ⚠️ Error eliminando foto ${photo.id}:`, err.message);
                    }
                }

                // Delete all photo records from database
                await Photo.destroy({ where: { eventId: event.id } });
                totalPhotosDeleted += photoCount;
            }

            // Mark event as cleaned
            await event.update({ photosCleanedAt: new Date() });

            // Send notification email to event owner
            if (event.user?.email) {
                try {
                    await sendPhotosDeletedEmail(
                        event.user.email,
                        event.user.name,
                        event.name
                    );
                } catch (err) {
                    console.error(`   ⚠️ Error enviando email a ${event.user.email}:`, err.message);
                }
            }

            console.log(`   ✅ Evento "${event.name}" limpiado (${photoCount} fotos eliminadas)`);
        }

        console.log(`🧹 [Cleanup] Completado: ${expiredEvents.length} eventos, ${totalPhotosDeleted} fotos eliminadas.\n`);
        return { cleaned: expiredEvents.length, photosDeleted: totalPhotosDeleted };

    } catch (error) {
        console.error('❌ [Cleanup] Error en limpieza:', error);
        return { cleaned: 0, photosDeleted: 0, error: error.message };
    }
}

/**
 * Send 7-day expiration warning emails
 */
async function sendExpirationWarnings() {
    const cutoffDate = getDateDaysAgo(DAYS_WARNING_7);

    try {
        const events = await Event.findAll({
            where: {
                eventDate: { [Op.lte]: cutoffDate },
                photosCleanedAt: null,
                expirationWarning7d: false
            },
            include: [
                { model: User, as: 'user', attributes: ['email', 'name'] },
                { model: Photo, as: 'photos', attributes: ['id'] }
            ]
        });

        if (events.length === 0) return { warned: 0 };

        let warned = 0;

        for (const event of events) {
            // Skip events with no photos
            if (event.photos.length === 0) {
                await event.update({ expirationWarning7d: true });
                continue;
            }

            const daysLeft = 7;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const downloadLink = `${frontendUrl}/event/${event.slug}`;

            if (event.user?.email) {
                try {
                    await sendExpirationWarningEmail(
                        event.user.email,
                        event.user.name,
                        event.name,
                        daysLeft,
                        downloadLink
                    );
                    warned++;
                } catch (err) {
                    console.error(`⚠️ Error enviando aviso a ${event.user.email}:`, err.message);
                }
            }

            await event.update({ expirationWarning7d: true });
        }

        if (warned > 0) {
            console.log(`📧 [Cleanup] Enviados ${warned} avisos de expiración (7 días).`);
        }
        return { warned };

    } catch (error) {
        console.error('❌ [Cleanup] Error enviando avisos 7d:', error);
        return { warned: 0, error: error.message };
    }
}

/**
 * Send 1-day final warning emails
 */
async function sendFinalWarnings() {
    const cutoffDate = getDateDaysAgo(DAYS_WARNING_1);

    try {
        const events = await Event.findAll({
            where: {
                eventDate: { [Op.lte]: cutoffDate },
                photosCleanedAt: null,
                expirationWarning1d: false
            },
            include: [
                { model: User, as: 'user', attributes: ['email', 'name'] },
                { model: Photo, as: 'photos', attributes: ['id'] }
            ]
        });

        if (events.length === 0) return { warned: 0 };

        let warned = 0;

        for (const event of events) {
            if (event.photos.length === 0) {
                await event.update({ expirationWarning1d: true });
                continue;
            }

            const daysLeft = 1;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const downloadLink = `${frontendUrl}/event/${event.slug}`;

            if (event.user?.email) {
                try {
                    await sendExpirationWarningEmail(
                        event.user.email,
                        event.user.name,
                        event.name,
                        daysLeft,
                        downloadLink
                    );
                    warned++;
                } catch (err) {
                    console.error(`⚠️ Error enviando aviso final a ${event.user.email}:`, err.message);
                }
            }

            await event.update({ expirationWarning1d: true });
        }

        if (warned > 0) {
            console.log(`📧 [Cleanup] Enviados ${warned} avisos finales (1 día).`);
        }
        return { warned };

    } catch (error) {
        console.error('❌ [Cleanup] Error enviando avisos 1d:', error);
        return { warned: 0, error: error.message };
    }
}

/**
 * Run all cleanup tasks
 * Called by the cron interval in index.js
 */
async function runCleanupCycle() {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔄 [Cleanup] Ejecutando ciclo de limpieza - ${new Date().toLocaleString('es-AR')}`);
    console.log(`${'='.repeat(50)}`);

    // 1. Send 7-day warnings first
    await sendExpirationWarnings();

    // 2. Send 1-day final warnings
    await sendFinalWarnings();

    // 3. Clean up expired photos
    const result = await cleanupExpiredPhotos();

    console.log(`🔄 [Cleanup] Ciclo completado.\n`);
    return result;
}

module.exports = {
    cleanupExpiredPhotos,
    sendExpirationWarnings,
    sendFinalWarnings,
    runCleanupCycle,
    DAYS_UNTIL_CLEANUP
};
