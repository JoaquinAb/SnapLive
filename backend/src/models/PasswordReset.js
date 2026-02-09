const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

/**
 * PasswordReset Model
 * Stores password reset tokens with expiration
 */
const PasswordReset = sequelize.define('PasswordReset', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: () => crypto.randomBytes(32).toString('hex')
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'password_resets'
});

/**
 * Check if token is valid (not expired and not used)
 */
PasswordReset.prototype.isValid = function () {
    return !this.used && new Date() < new Date(this.expiresAt);
};

module.exports = PasswordReset;
