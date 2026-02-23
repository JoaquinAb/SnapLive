const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('Testing email connection (Gmail)...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);
    console.log(`Secure: ${process.env.SMTP_SECURE}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        debug: true,
        logger: true
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Server connection verified');

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER,
            subject: 'Test Email (Gmail Config)',
            text: 'If you receive this, the Gmail configuration is working locally!',
            html: '<b>If you receive this, the Gmail configuration is working locally!</b>'
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testEmail();
