const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// CONFIGURATION
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const EVENT_SLUG = process.argv[2]; // Pass slug as argument
const CONCURRENCY = parseInt(process.argv[3]) || 10; // Number of concurrent users
const TOTAL_REQUESTS = parseInt(process.argv[4]) || 50; // Total photos to upload

if (!EVENT_SLUG) {
    console.error('Usage: node stress-test.js <event-slug> [concurrency] [total-requests]');
    process.exit(1);
}

// Generate a dummy image buffer (small 1x1 pixel jpg)
// minimal valid jpeg buffer
// Image buffer will be generated in runTest
let dummyImageBuffer;


async function uploadPhoto(index) {
    const form = new FormData();
    // Append buffer with a filename
    form.append('photos', dummyImageBuffer, {
        filename: `stress-test-${index}.jpg`,
        contentType: 'image/jpeg',
    });
    form.append('uploaderName', `StressTester ${index}`);

    const startTime = Date.now();
    try {
        await axios.post(`${API_URL}/photos/${EVENT_SLUG}`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        const duration = Date.now() - startTime;
        return { success: true, duration };
    } catch (error) {
        console.error('Request failed:', error);
        const duration = Date.now() - startTime;
        let errorMsg = error.message || 'Unknown Error';
        if (error.response) {
            errorMsg = `${error.response.status} ${error.response.statusText}`;
            if (error.response.data) {
                // Try to get more details if available
                try {
                    errorMsg += ` - ${JSON.stringify(error.response.data)}`;
                } catch (e) {
                    errorMsg += ` - ${error.response.data}`;
                }
            }
        } else if (error.request) {
            errorMsg = 'No response received';
        }
        return {
            success: false,
            duration,
            error: errorMsg
        };
    }
}

async function runTest() {
    console.log(`Starting stress test against ${API_URL}`);
    console.log(`Event Slug: ${EVENT_SLUG}`);
    console.log(`Concurrency: ${CONCURRENCY}`);
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log('-----------------------------------');

    // Generate valid JPEG buffer
    try {
        dummyImageBuffer = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 3,
                background: { r: 255, g: 0, b: 0 }
            }
        })
            .jpeg()
            .toBuffer();
        console.log('Generated valid JPEG buffer');
    } catch (err) {
        console.error('Failed to generate image buffer:', err);
        return;
    }

    let completed = 0;
    let active = 0;
    const results = [];
    const startTime = Date.now();

    const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);

    async function worker() {
        while (queue.length > 0) {
            const index = queue.shift();
            active++;
            process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS} (Active: ${active})`);

            const result = await uploadPhoto(index);
            results.push(result);

            completed++;
            active--;
            process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS} (Active: ${active})`);
        }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS) }, () => worker());
    await Promise.all(workers);

    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n\n-----------------------------------');
    console.log('TEST COMPLETE');
    console.log(`Total Time: ${totalTime.toFixed(2)}s`);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);

    if (successful.length > 0) {
        const avgTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
        console.log(`Avg Request Time: ${avgTime.toFixed(2)}ms`);
    }

    if (failed.length > 0) {
        console.log('\nErrors:');
        const errorCounts = {};
        failed.forEach(r => {
            errorCounts[r.error] = (errorCounts[r.error] || 0) + 1;
        });
        Object.entries(errorCounts).forEach(([err, count]) => {
            console.log(`${err}: ${count}`);
        });
    }
}

runTest();
