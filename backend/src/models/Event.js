const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Event Model
 * Represents an event created by a client
 * Users can have multiple events (each requires payment)
 */
const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        // Removed unique constraint - users can have multiple events
        references: {
            model: 'users',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [3, 100]
        }
    },
    type: {
        type: DataTypes.ENUM('wedding', 'quinceañera', 'birthday', 'corporate', 'party', 'other'),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    qrCodeUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'events',
    hooks: {
        // Generate unique slug before validating
        beforeValidate: (event) => {
            if (!event.slug) {
                const randomStr = uuidv4().split('-')[0];
                const nameSlug = event.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .substring(0, 30);
                event.slug = `${nameSlug}-${randomStr}`;
            }
        }
    }
});

module.exports = Event;
