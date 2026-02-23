const io = require('socket.io-client');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Change to production URL if needed
const EVENT_SLUG = process.argv[2] || 'test-event'; // Pass event slug as argument
const NUM_VIEWERS = 100;
const NUM_UPLOADERS = 10;
const TEST_DURATION_MS = 60 * 1000; // 1 minute

const VIEWERS = [];
const UPLOADERS = [];

console.log(`Starting load test on ${BASE_URL} for event: ${EVENT_SLUG}`);
console.log(`Viewers: ${NUM_VIEWERS}, Uploaders: ${NUM_UPLOADERS}`);

// Metrics
let connectedViewers = 0;
let photosUploaded = 0;
let photosReceived = 0;
let errors = 0;

// Setup Viewers
for (let i = 0; i < NUM_VIEWERS; i++) {
    const socket = io(BASE_URL);

    socket.on('connect', () => {
        connectedViewers++;
        socket.emit('join-event', EVENT_SLUG);
    });

    socket.on('new-photo', (data) => {
        photosReceived++;
    });

    socket.on('disconnect', () => {
        connectedViewers--;
    });

    socket.on('connect_error', (err) => {
        errors++;
        // console.error(`Viewer ${i} error:`, err.message);
    });

    VIEWERS.push(socket);
}

// Setup Uploaders
const uploadPhoto = async (uploaderId) => {
    try {
        const form = new FormData();
        const imagePath = path.join(__dirname, 'test-image.jpg');

        if (!fs.existsSync(imagePath)) {
            console.error('Test image not found!');
            return;
        }

        form.append('photos', fs.createReadStream(imagePath));
        form.append('uploaderName', `LoadTester_${uploaderId}`);

        const start = Date.now();
        await axios.post(`${BASE_URL}/api/photos/${EVENT_SLUG}`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        const duration = Date.now() - start;
        photosUploaded++;
        console.log(`[Uploader ${uploaderId}] Uploaded in ${duration}ms`);
    } catch (error) {
        errors++;
        console.error(`[Uploader ${uploaderId}] Failed:`, error.message);
    }
};

// Start Upload Loop
const uploadInterval = setInterval(() => {
    // Randomly pick an uploader to upload
    const uploaderId = Math.floor(Math.random() * NUM_UPLOADERS);
    uploadPhoto(uploaderId);
}, 2000); // Upload every 2 seconds

// Status Report Loop
const statusInterval = setInterval(() => {
    console.log('--- Status Report ---');
    console.log(`Connected Viewers: ${connectedViewers}/${NUM_VIEWERS}`);
    console.log(`Photos Uploaded: ${photosUploaded}`);
    console.log(`Photos Received (Total across all viewers): ${photosReceived}`);
    console.log(`Errors: ${errors}`);
    console.log('---------------------');
}, 5000);

// Stop Test
setTimeout(() => {
    console.log('Test finished. Cleaning up...');
    clearInterval(uploadInterval);
    clearInterval(statusInterval);

    VIEWERS.forEach(socket => socket.disconnect());

    console.log('Final Results:');
    console.log(`Total Photos Uploaded: ${photosUploaded}`);
    console.log(`Total Photos Received: ${photosReceived}`); // Should be roughly Uploaded * Viewers
    console.log(`Total Errors: ${errors}`);
}, TEST_DURATION_MS);
