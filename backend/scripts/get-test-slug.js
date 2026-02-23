require('dotenv').config();
const { Event } = require('../src/models');

async function run() {
    try {
        const event = await Event.findOne({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        });

        if (event) {
            console.log(`SLUG:${event.slug}`);
        } else {
            console.log('SLUG:NONE');
        }
    } catch (error) {
        console.error('Error fetching event:', error);
    }
    process.exit(0);
}

run();
