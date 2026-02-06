/**
 * Stripe Configuration
 * Only initialized if credentials are provided
 */

const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.STRIPE_SECRET_KEY;

let stripe = null;

if (!DEMO_MODE && process.env.STRIPE_SECRET_KEY) {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
    });
}

module.exports = stripe;
