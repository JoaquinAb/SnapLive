const express = require('express');
const { Photo, Event } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ImageService = require('../services/image');
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

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No se subieron fotos'
            });
        }

        const uploadedPhotos = [];

        // Process each uploaded file
        for (const file of req.files) {
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

        res.status(201).json({
            message: `${uploadedPhotos.length} foto(s) subida(s) exitosamente`,
            photos: uploadedPhotos
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
