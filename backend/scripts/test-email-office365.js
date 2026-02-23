const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('Testing email connection with host: "smtp.office365.com"...');
    console.log(`User: ${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true,
        logger: true
    });

    try {
        await transporter.verify();
        console.log('✅ Server connection verified');

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER,
            subject: 'Test Email (Office365 Host)',
            text: 'If you receive this, the Office365 configuration is working!'
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testEmail();
