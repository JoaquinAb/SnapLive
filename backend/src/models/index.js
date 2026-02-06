const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Photo = require('./Photo');
const Payment = require('./Payment');

// Define relationships

// User has one Event
// User has many Events
User.hasMany(Event, {
    foreignKey: 'userId',
    as: 'events',
    onDelete: 'CASCADE'
});
Event.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Event has many Photos
Event.hasMany(Photo, {
    foreignKey: 'eventId',
    as: 'photos',
    onDelete: 'CASCADE'
});
Photo.belongsTo(Event, {
    foreignKey: 'eventId',
    as: 'event'
});

// User has many Payments
User.hasMany(Payment, {
    foreignKey: 'userId',
    as: 'payments',
    onDelete: 'CASCADE'
});
Payment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Event has one Payment (optional - for tracking)
Event.hasOne(Payment, {
    foreignKey: 'eventId',
    as: 'payment'
});
Payment.belongsTo(Event, {
    foreignKey: 'eventId',
    as: 'event'
});

module.exports = {
    sequelize,
    User,
    Event,
    Photo,
    Payment
};
