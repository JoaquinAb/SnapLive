/**
 * MercadoPago Configuration
 * Only initialized if credentials are provided
 */

const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.MERCADOPAGO_ACCESS_TOKEN;

let mercadopago = null;

if (!DEMO_MODE && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    const { MercadoPagoConfig } = require('mercadopago');
    mercadopago = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    });
}

module.exports = mercadopago;
