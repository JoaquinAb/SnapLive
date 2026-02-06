const { User } = require('../models');

/**
 * Admin Middleware
 * Verifies that the authenticated user has admin role
 */
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Se requieren privilegios de administrador.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Error al verificar permisos de administrador' });
    }
};

module.exports = { isAdmin };
