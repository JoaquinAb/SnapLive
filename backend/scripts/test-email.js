const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('Testing email connection with service: "hotmail"...');
    console.log(`User: ${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        debug: true,
        logger: true
    });

    try {
        // Verify connection configuration
        await transporter.verify();
        console.log('✅ Server connection verified');

        // Send test email
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email from SnapLive Script (Hotmail Service)',
            text: 'If you receive this, the email configuration is working!',
            html: '<b>If you receive this, the email configuration is working!</b>'
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testEmail();
