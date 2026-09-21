const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header or query string
        let token;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                error: 'Acceso denegado. No se proporcionó token.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: 'Token inválido. Usuario no encontrado.'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado. Por favor iniciá sesión nuevamente.'
            });
        }
        return res.status(401).json({
            error: 'Token inválido.'
        });
    }
};

/**
 * Optional auth middleware
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.userId);
            if (user) {
                req.user = user;
                req.userId = user.id;
            }
        }

        next();
    } catch (error) {
        // Token invalid, but continue anyway
        next();
    }
};

module.exports = { auth, optionalAuth };
