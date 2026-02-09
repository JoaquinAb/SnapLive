const express = require('express');
const { Payment, User } = require('../models');
const { auth } = require('../middleware/auth');
const { sendPaymentConfirmationEmail } = require('../services/email');

const router = express.Router();

// Demo mode - only when explicitly set to true
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Event subscription price 
const EVENT_PRICE = {
    stripe: parseInt(process.env.STRIPE_PRICE_CENTS) || 2999, // 29.99 USD in cents
    mercadopago: parseInt(process.env.MERCADOPAGO_PRICE_ARS) || 4999 // 4999 ARS
};

/**
 * POST /api/payments/stripe/create-session
 * Create Stripe checkout session
 */
router.post('/stripe/create-session', auth, async (req, res) => {
    try {
        // Demo mode - simulate payment
        if (DEMO_MODE) {
            // Create demo payment record
            await Payment.create({
                userId: req.userId,
                provider: 'demo',
                paymentId: `demo_${Date.now()}`,
                amount: 29.99,
                currency: 'USD',
                status: 'completed',
                metadata: { demo: true }
            });

            // Send confirmation email
            const user = await User.findByPk(req.userId);
            if (user) {
                sendPaymentConfirmationEmail(user.email, user.name, 2999);
            }

            return res.json({
                demo: true,
                message: 'Modo demo activado - pago simulado exitoso',
                url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=success&demo=true`
            });
        }

        // Real Stripe integration
        const stripe = require('../config/stripe');
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'SnapLive - Suscripción de Evento',
                            description: 'Creá y administrá un evento con subidas ilimitadas de fotos'
                        },
                        unit_amount: EVENT_PRICE.stripe
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancelled`,
            metadata: {
                userId: req.userId
            }
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ error: 'Error al crear la sesión de pago. Verificá las credenciales de Stripe.' });
    }
});

/**
 * POST /api/payments/stripe/webhook
 * Handle Stripe webhooks
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (DEMO_MODE) {
        return res.json({ received: true, demo: true });
    }

    const stripe = require('../config/stripe');
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;

            await Payment.create({
                userId,
                provider: 'stripe',
                paymentId: session.id,
                amount: session.amount_total / 100,
                currency: session.currency.toUpperCase(),
                status: 'completed',
                metadata: { sessionId: session.id }
            });

            // Send confirmation email
            const user = await User.findByPk(userId);
            if (user) {
                sendPaymentConfirmationEmail(user.email, user.name, session.amount_total);
            }

            console.log(`Pago completado para usuario: ${userId}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).json({ error: `Error de webhook: ${error.message}` });
    }
});

/**
 * POST /api/payments/mercadopago/create-preference
 * Create MercadoPago preference
 */
router.post('/mercadopago/create-preference', auth, async (req, res) => {
    try {
        // Demo mode - simulate payment
        if (DEMO_MODE) {
            await Payment.create({
                userId: req.userId,
                provider: 'demo',
                paymentId: `demo_mp_${Date.now()}`,
                amount: 4999,
                currency: 'ARS',
                status: 'completed',
                metadata: { demo: true }
            });

            // Send confirmation email
            const user = await User.findByPk(req.userId);
            if (user) {
                sendPaymentConfirmationEmail(user.email, user.name, 499900);
            }

            return res.json({
                demo: true,
                message: 'Modo demo activado - pago simulado exitoso',
                initPoint: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=success&demo=true`,
                sandboxInitPoint: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=success&demo=true`
            });
        }

        // Real MercadoPago integration
        const mercadopago = require('../config/mercadopago');
        const { Preference } = require('mercadopago');
        const preference = new Preference(mercadopago);

        const preferenceBody = {
            items: [
                {
                    title: 'SnapLive - Suscripción de Evento',
                    description: 'Creá y administrá un evento con subidas ilimitadas de fotos',
                    quantity: 1,
                    unit_price: EVENT_PRICE.mercadopago,
                    currency_id: 'ARS'
                }
            ],
            back_urls: {
                success: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
                failure: `${process.env.FRONTEND_URL}/dashboard?payment=failed`,
                pending: `${process.env.FRONTEND_URL}/dashboard?payment=pending`
            },
            auto_return: 'approved',
            external_reference: req.userId,
            notification_url: `${process.env.BACKEND_URL}/api/payments/mercadopago/webhook`
        };

        console.log('Creating MercadoPago preference with body:', JSON.stringify(preferenceBody, null, 2));

        const result = await preference.create({
            body: preferenceBody
        });

        res.json({
            preferenceId: result.id,
            initPoint: result.init_point,
            sandboxInitPoint: result.sandbox_init_point
        });
    } catch (error) {
        console.error('MercadoPago preference error:', error);
        res.status(500).json({ error: 'Error al crear la preferencia de pago. Verificá las credenciales de MercadoPago.' });
    }
});

/**
 * POST /api/payments/mercadopago/webhook
 * Handle MercadoPago webhooks
 */
router.post('/mercadopago/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            console.log('Notificación de pago MercadoPago:', data);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('MercadoPago webhook error:', error);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
});

/**
 * GET /api/payments/status
 * Check if user has a valid payment for creating an event
 */
router.get('/status', auth, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            where: {
                userId: req.userId,
                status: 'completed',
                eventId: null
            },
            order: [['createdAt', 'DESC']]
        });

        // Now both demo and production require a pending payment
        // In demo mode, we just simulate the payment quickly
        res.json({
            canCreateEvent: !!payment,
            demoMode: DEMO_MODE,
            payment: payment ? {
                id: payment.id,
                provider: payment.provider,
                amount: payment.amount,
                currency: payment.currency,
                createdAt: payment.createdAt
            } : null
        });
    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ error: 'Error al verificar estado del pago' });
    }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', auth, async (req, res) => {
    try {
        const payments = await Payment.findAll({
            where: { userId: req.userId },
            order: [['createdAt', 'DESC']]
        });

        res.json({ payments });
    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ error: 'Error al obtener historial de pagos' });
    }
});

module.exports = router;
