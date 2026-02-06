const { Event } = require('./src/models');

async function checkQR() {
    try {
        const events = await Event.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'qrCodeUrl']
        });

        console.log('Last 5 Events:');
        events.forEach(e => {
            console.log(`Event: ${e.name}`);
            console.log(`QR URL: ${e.qrCodeUrl}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkQR();
