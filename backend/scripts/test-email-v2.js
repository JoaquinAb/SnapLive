const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('Testing email connection with "kitchen sink" settings...');
    console.log(`User: ${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            ciphers: 'SSLv3',
            minVersion: 'TLSv1',
            rejectUnauthorized: false
        },
        requireTLS: true, // Force STARTTLS
        debug: true,
        logger: true
    });

    try {
        await transporter.verify();
        console.log('✅ Server connection verified');

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER,
            subject: 'Test Email (V2 Settings)',
            text: 'If you receive this, the V2 configuration is working!'
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testEmail();
