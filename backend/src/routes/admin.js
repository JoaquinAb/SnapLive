const express = require('express');
const { User, Event, Photo } = require('../models');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(isAdmin);

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalEvents = await Event.count();
        const totalPhotos = await Photo.count();
        const activeEvents = await Event.count({ where: { isActive: true } });

        res.json({
            users: totalUsers,
            events: totalEvents,
            photos: totalPhotos,
            activeEvents
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

/**
 * GET /api/admin/users
 * Get list of users with stats
 */
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'createdAt'],
            include: [{
                model: Event,
                as: 'events', // Assuming association alias is 'events' or none
                attributes: ['id']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Format response
        const userList = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            joinedAt: user.createdAt,
            eventsCount: user.events ? user.events.length : 0
        }));

        res.json({ users: userList });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

module.exports = router;
