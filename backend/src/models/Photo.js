const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Photo Model
 * Represents a photo uploaded by a guest to an event
 */
const Photo = sequelize.define('Photo', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'events',
            key: 'id'
        }
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    publicId: {
        type: DataTypes.STRING,
        allowNull: false // Cloudinary public_id for deletion
    },
    uploaderName: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Anonymous'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'photos'
});

module.exports = Photo;
