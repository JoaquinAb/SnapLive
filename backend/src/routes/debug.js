const express = require('express');
const nodemailer = require('nodemailer');
const { isEmailConfigured } = require('../services/email');

const router = express.Router();

/**
 * GET /api/debug/email
 * Test SMTP connection and configuration
 */
router.get('/email', async (req, res) => {
    try {
        const config = {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            secure: process.env.SMTP_SECURE,
            isConfigured: isEmailConfigured()
        };

        const logs = [];
        logs.push(`[DEBUG] Checking email configuration...`);
        logs.push(`[DEBUG] Host: ${config.host}`);
        logs.push(`[DEBUG] Port: ${config.port}`);
        logs.push(`[DEBUG] User: ${config.user ? config.user.substring(0, 3) + '***' : 'MISSING'}`);
        logs.push(`[DEBUG] Secure: ${config.secure}`);

        if (!config.isConfigured) {
            logs.push(`[ERROR] Missing required environment variables.`);
            return res.status(500).json({ status: 'error', logs, config });
        }

        logs.push(`[DEBUG] Creating transporter...`);
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            debug: true,
            logger: true
        });

        logs.push(`[DEBUG] Verifying connection...`);
        try {
            await transporter.verify();
            logs.push(`[SUCCESS] Connection verified successfully!`);
        } catch (verifyError) {
            logs.push(`[ERROR] Verify failed: ${verifyError.message}`);
            logs.push(`[ERROR] Verify stack: ${verifyError.stack}`);
            return res.status(500).json({ status: 'failed', step: 'verify', error: verifyError.message, logs });
        }

        // Attempt to send a test email to the sender itself
        logs.push(`[DEBUG] Sending test email to ${process.env.SMTP_USER}...`);
        try {
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: process.env.SMTP_USER,
                subject: 'SnapLive SMTP Debug Test',
                text: 'If you receive this, SMTP is working correctly!'
            });
            logs.push(`[SUCCESS] Email sent: ${info.messageId}`);
            logs.push(`[DEBUG] Response: ${info.response}`);
        } catch (sendError) {
            logs.push(`[ERROR] Send failed: ${sendError.message}`);
            return res.status(500).json({ status: 'failed', step: 'send', error: sendError.message, logs });
        }

        res.json({ status: 'success', logs });

    } catch (error) {
        res.status(500).json({
            status: 'crashed',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
