const express = require('express');
const { Resend } = require('resend');
const { isEmailConfigured } = require('../services/email');

const router = express.Router();

/**
 * GET /api/debug/email
 * Test Resend API configuration
 */
router.get('/email', async (req, res) => {
    try {
        const logs = [];
        logs.push(`[DEBUG] Checking email service configuration...`);

        const isConfigured = isEmailConfigured();
        logs.push(`[DEBUG] Email Service Configured: ${isConfigured ? 'YES' : 'NO'}`);
        logs.push(`[DEBUG] RESEND_API_KEY present: ${process.env.RESEND_API_KEY ? 'YES (masked)' : 'NO'}`);

        if (!isConfigured) {
            logs.push(`[ERROR] Email service is active in DEMO MODE (no API key detected).`);
            logs.push(`[TIP] Ensure RESEND_API_KEY is set in your Railway variables.`);
            return res.status(500).json({ status: 'error', mode: 'demo', logs });
        }

        logs.push(`[DEBUG] Initializing Resend client...`);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Attempt to send a test email
        // We use the 'to' address as the user themselves, or a safe testing address if needed.
        // For testing, Resend only allows sending to the verified domain or the user's email if in testing mode.
        // SnapLive <onboarding@resend.dev> is the default testing sender.
        const userEmail = 'joaquinabreu14@hotmail.com'; // Hardcoded for this debug test based on user context, or use a query param
        const targetEmail = req.query.to || userEmail;

        logs.push(`[DEBUG] Sending test email to: ${targetEmail}`);

        try {
            const { data, error } = await resend.emails.send({
                from: 'SnapLive Debug <onboarding@resend.dev>',
                to: [targetEmail],
                subject: 'SnapLive Resend Debug Test',
                html: '<strong>It works!</strong> The Resend API is correctly configured.'
            });

            if (error) {
                logs.push(`[ERROR] Resend API returned error: ${error.message}`);
                logs.push(`[ERROR] Full Error: ${JSON.stringify(error)}`);
                return res.status(500).json({ status: 'failed', step: 'send', error: error.message, logs });
            }

            logs.push(`[SUCCESS] Email sent successfully!`);
            logs.push(`[DEBUG] Message ID: ${data.id}`);

            return res.json({ status: 'success', data, logs });

        } catch (sendError) {
            logs.push(`[ERROR] Exception during send: ${sendError.message}`);
            logs.push(`[ERROR] Stack: ${sendError.stack}`);
            return res.status(500).json({ status: 'failed', step: 'exception', error: sendError.message, logs });
        }

    } catch (error) {
        res.status(500).json({
            status: 'crashed',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
