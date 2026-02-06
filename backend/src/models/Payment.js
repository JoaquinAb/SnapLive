const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Payment Model
 * Represents a payment made by a user for an event
 */
const Payment = sequelize.define('Payment', {
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
    eventId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null until event is created
        references: {
            model: 'events',
            key: 'id'
        }
    },
    provider: {
        type: DataTypes.ENUM('stripe', 'mercadopago', 'demo'),
        allowNull: false
    },
    paymentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'payments'
});

module.exports = Payment;
