const express = require('express');
const { Event, Photo, Payment } = require('../models');
const { auth, optionalAuth } = require('../middleware/auth');
const QRService = require('../services/qr');

const router = express.Router();

// Demo mode - allows testing without real payments
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.STRIPE_SECRET_KEY;

/**
 * POST /api/events
 * Create a new event (requires payment or demo mode)
 */
router.post('/', auth, async (req, res) => {
    try {
        const { name, type, eventDate } = req.body;

        // Validate input
        if (!name || !type || !eventDate) {
            return res.status(400).json({
                error: 'El nombre, tipo y fecha del evento son requeridos'
            });
        }

        // Check if user has a completed payment (real or demo)
        const payment = await Payment.findOne({
            where: {
                userId: req.userId,
                status: 'completed',
                eventId: null
            }
        });

        if (!payment) {
            return res.status(402).json({
                error: 'Pago requerido. Completá el pago antes de crear un evento.',
                requiresPayment: true
            });
        }

        // Create event
        const event = await Event.create({
            userId: req.userId,
            name,
            type,
            eventDate,
            isPaid: true,
            isActive: true
        });

        // Generate QR code
        let qrCodeUrl = null;
        try {
            qrCodeUrl = await QRService.generateAndUpload(event.slug);
            await event.update({ qrCodeUrl });
        } catch (qrError) {
            console.error('Error generating QR:', qrError);
        }

        // Assign payment to event
        if (payment) {
            await payment.update({ eventId: event.id });
        }

        res.status(201).json({
            message: 'Evento creado exitosamente',
            event: {
                id: event.id,
                name: event.name,
                type: event.type,
                slug: event.slug,
                eventDate: event.eventDate,
                qrCodeUrl: event.qrCodeUrl,
                isActive: event.isActive
            }
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Error al crear el evento' });
    }
});

/**
 * GET /api/events/my-events
 * Get all events for current user
 */
router.get('/my-events', auth, async (req, res) => {
    try {
        const events = await Event.findAll({
            where: { userId: req.userId },
            include: [{
                model: Photo,
                as: 'photos',
                order: [['createdAt', 'DESC']]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ events });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Error al obtener los eventos' });
    }
});

/**
 * GET /api/events/my-event (legacy - returns first event)
 * @deprecated Use /my-events instead
 */
router.get('/my-event', auth, async (req, res) => {
    try {
        const event = await Event.findOne({
            where: { userId: req.userId },
            include: [{
                model: Photo,
                as: 'photos',
                order: [['createdAt', 'DESC']],
                limit: 50
            }],
            order: [['createdAt', 'DESC']]
        });

        if (!event) {
            return res.status(404).json({
                error: 'No tenés un evento creado. Creá uno primero.'
            });
        }

        res.json({ event });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Error al obtener el evento' });
    }
});

/**
 * GET /api/events/:slug
 * Get event by slug (public - for guests)
 */
router.get('/:slug', optionalAuth, async (req, res) => {
    try {
        const { slug } = req.params;

        const event = await Event.findOne({
            where: { slug, isActive: true },
            include: [{
                model: Photo,
                as: 'photos',
                order: [['createdAt', 'DESC']]
            }]
        });

        if (!event) {
            return res.status(404).json({
                error: 'Evento no encontrado o no está activo'
            });
        }

        res.json({
            event: {
                id: event.id,
                name: event.name,
                type: event.type,
                slug: event.slug,
                eventDate: event.eventDate,
                photos: event.photos
            }
        });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Error al obtener el evento' });
    }
});

/**
 * PUT /api/events/:id
 * Update event (owner only)
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, eventDate, isActive } = req.body;

        const event = await Event.findOne({
            where: { id, userId: req.userId }
        });

        if (!event) {
            return res.status(404).json({
                error: 'Evento no encontrado'
            });
        }

        await event.update({
            name: name || event.name,
            type: type || event.type,
            eventDate: eventDate || event.eventDate,
            isActive: isActive !== undefined ? isActive : event.isActive
        });

        res.json({
            message: 'Evento actualizado',
            event
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Error al actualizar el evento' });
    }
});

/**
 * DELETE /api/events/:id
 * Delete event (owner only)
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findOne({
            where: { id, userId: req.userId }
        });

        if (!event) {
            return res.status(404).json({
                error: 'Evento no encontrado'
            });
        }

        await event.destroy();

        res.json({ message: 'Evento eliminado exitosamente' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Error al eliminar el evento' });
    }
});

/**
 * GET /api/events/:slug/qr
 * Get QR code for event
 */
router.get('/:slug/qr', async (req, res) => {
    try {
        const { slug } = req.params;
        const { format } = req.query;

        const event = await Event.findOne({ where: { slug } });

        if (!event) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        if (format === 'base64') {
            const qrBase64 = await QRService.generateBase64(slug);
            res.json({ qr: qrBase64 });
        } else {
            res.json({ qrCodeUrl: event.qrCodeUrl });
        }
    } catch (error) {
        console.error('Get QR error:', error);
        res.status(500).json({ error: 'Error al generar código QR' });
    }
});

module.exports = router;
