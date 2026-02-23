const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('Testing email connection (Minimal Config)...');
    console.log(`User: ${process.env.SMTP_USER}`);

    // Minimal config - let nodemailer handle the defaults
    const transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false, // STARTTLS
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
            subject: 'Test Email (Minimal Config)',
            text: 'If you receive this, the minimal configuration is working!'
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testEmail();
