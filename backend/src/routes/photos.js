const express = require('express');
const { Photo, Event } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ImageService = require('../services/image');
const ModerationService = require('../services/moderation');
const wsService = require('../services/websocket');

const router = express.Router();

/**
 * POST /api/photos/:eventSlug
 * Upload photos to an event (guests can upload without auth)
 */
router.post('/:eventSlug', upload.array('photos', 5), async (req, res) => {
    try {
        const { eventSlug } = req.params;
        const { uploaderName } = req.body;

        // Find event
        const event = await Event.findOne({
            where: { slug: eventSlug, isActive: true }
        });

        if (!event) {
            return res.status(404).json({
                error: 'Evento no encontrado o no está activo'
            });
        }

        // Verificar si el evento ya pasó (permitir subidas hasta 24hs después de la fecha del evento)
        const now = new Date();
        const eventDateEnd = new Date(event.eventDate);
        eventDateEnd.setDate(eventDateEnd.getDate() + 1); // Agregar 1 día (24hs)
        eventDateEnd.setHours(23, 59, 59, 999); // Hasta el final del día siguiente

        if (now > eventDateEnd) {
            return res.status(403).json({
                error: 'Este evento ya finalizó. No se pueden subir más fotos.'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No se subieron fotos'
            });
        }

        const uploadedPhotos = [];
        const rejectedPhotos = [];

        // Process each uploaded file
        for (const file of req.files) {
            // Check content moderation
            const moderationResult = await ModerationService.checkImage(file.buffer);

            if (!moderationResult.safe) {
                rejectedPhotos.push({
                    filename: file.originalname,
                    reason: moderationResult.reason
                });
                continue; // Skip this photo
            }

            // Upload to Cloudinary with optimization
            const { url, thumbnailUrl, publicId } = await ImageService.uploadPhoto(
                file.buffer,
                event.id
            );

            // Create photo record
            const photo = await Photo.create({
                eventId: event.id,
                url,
                thumbnailUrl,
                publicId,
                uploaderName: uploaderName || 'Anónimo'
            });

            uploadedPhotos.push(photo);

            // Emit real-time update
            wsService.emitNewPhoto(eventSlug, {
                id: photo.id,
                url: photo.url,
                thumbnailUrl: photo.thumbnailUrl,
                uploaderName: photo.uploaderName,
                createdAt: photo.createdAt,
                eventSlug: eventSlug // Add slug for frontend filtering
            });
        }

        // If all photos were rejected
        if (uploadedPhotos.length === 0 && rejectedPhotos.length > 0) {
            return res.status(400).json({
                error: 'Las fotos fueron rechazadas por contener contenido inapropiado',
                rejectedPhotos
            });
        }

        // Build response message
        let message = `${uploadedPhotos.length} foto(s) subida(s) exitosamente`;
        if (rejectedPhotos.length > 0) {
            message += `. ${rejectedPhotos.length} foto(s) rechazada(s) por contenido inapropiado`;
        }

        res.status(201).json({
            message,
            photos: uploadedPhotos,
            rejectedPhotos: rejectedPhotos.length > 0 ? rejectedPhotos : undefined
        });
    } catch (error) {
        console.error('Upload photos error:', error);
        res.status(500).json({ error: 'Error al subir las fotos' });
    }
});

/**
 * GET /api/photos/:eventSlug
 * Get all photos for an event
 */
router.get('/:eventSlug', async (req, res) => {
    try {
        const { eventSlug } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Find event
        const event = await Event.findOne({
            where: { slug: eventSlug, isActive: true }
        });

        if (!event) {
            return res.status(404).json({
                error: 'Evento no encontrado o no está activo'
            });
        }

        // Get photos with pagination
        const offset = (page - 1) * limit;
        const { count, rows: photos } = await Photo.findAndCountAll({
            where: { eventId: event.id },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            photos,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get photos error:', error);
        res.status(500).json({ error: 'Error al obtener las fotos' });
    }
});

/**
 * DELETE /api/photos/:photoId
 * Delete a photo (event owner only)
 */
router.delete('/:photoId', optionalAuth, async (req, res) => {
    try {
        const { photoId } = req.params;

        const photo = await Photo.findByPk(photoId, {
            include: [{ model: Event, as: 'event' }]
        });

        if (!photo) {
            return res.status(404).json({ error: 'Foto no encontrada' });
        }

        // Check ownership
        if (photo.event.userId !== req.userId) {
            return res.status(403).json({
                error: 'No tenés permiso para eliminar esta foto'
            });
        }

        // Delete from Cloudinary
        await ImageService.deletePhoto(photo.publicId);

        // Get event slug before deleting
        const eventSlug = photo.event.slug;

        // Delete from database
        await photo.destroy();

        // Emit real-time update
        wsService.emitPhotoDeleted(eventSlug, photoId);

        res.json({ message: 'Foto eliminada exitosamente' });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ error: 'Error al eliminar la foto' });
    }
});

module.exports = router;
