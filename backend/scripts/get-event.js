require('dotenv').config();
const { Event } = require('../src/models');

async function getLatestEvent() {
    try {
        const event = await Event.findOne({
            order: [['createdAt', 'DESC']],
            attributes: ['slug', 'name', 'isActive']
        });

        if (event) {
            console.log(`Latest Event: ${event.name}`);
            console.log(`Slug: ${event.slug}`);
            console.log(`Active: ${event.isActive}`);
        } else {
            console.log('No events found');
        }
    } catch (error) {
        console.error('Error fetching event:', error);
    }
}

getLatestEvent();
