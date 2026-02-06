const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Event } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'El email, contraseña y nombre son requeridos'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                error: 'Este email ya está registrado'
            });
        }

        // Create user
        const user = await User.create({ email, password, name });

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'El email y contraseña son requeridos'
            });
        }

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                error: 'Email o contraseña incorrectos'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Email o contraseña incorrectos'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            include: [{
                model: Event,
                as: 'events'
            }],
            attributes: { exclude: ['password'] }
        });

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

module.exports = router;
