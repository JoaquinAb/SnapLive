const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for password reset, etc.
 * Supports demo mode when no SMTP is configured
 */

// Check if email is configured
const isEmailConfigured = () => {
    return process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
};

// Create transporter based on configuration
const createTransporter = () => {
    if (!isEmailConfigured()) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,
        socketTimeout: 10000,
        debug: true, // Enable debug logs in production to trace issues
        logger: true // Enable internal logger
    });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @returns {Promise<{success: boolean, demo?: boolean}>}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Demo mode - just log to console
    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MODO DEMO - EMAIL DE RECUPERACIÓN');
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Link de recuperación: ${resetLink}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true, resetLink };
    }

    // Real email sending
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.SMTP_FROM || '"SnapLive" <noreply@snaplive.com>',
        to: email,
        subject: '🔐 Recuperar contraseña - SnapLive',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed;">📸 SnapLive</h1>
                </div>
                
                <h2 style="color: #333;">Recuperar contraseña</h2>
                
                <p style="color: #666; font-size: 16px;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                </p>
                
                <p style="color: #666; font-size: 16px;">
                    Hacé clic en el siguiente botón para crear una nueva contraseña:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background: linear-gradient(135deg, #7c3aed, #a855f7); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-size: 16px;
                              display: inline-block;">
                        Restablecer Contraseña
                    </a>
                </div>
                
                <p style="color: #999; font-size: 14px;">
                    Este link expira en 1 hora. Si no solicitaste este cambio, podés ignorar este email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © SnapLive - Compartí los mejores momentos
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error al enviar el email');
    }
};

/**
 * Send payment confirmation email
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @param {number} amount - Payment amount
 * @returns {Promise<{success: boolean, demo?: boolean}>}
 */
const sendPaymentConfirmationEmail = async (email, userName, amount = 4999) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardLink = `${frontendUrl}/dashboard`;
    const formattedAmount = (amount / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    // Demo mode - just log to console
    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MODO DEMO - EMAIL DE CONFIRMACIÓN DE PAGO');
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Usuario: ${userName}`);
        console.log(`Monto: ${formattedAmount}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true };
    }

    // Real email sending
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.SMTP_FROM || '"SnapLive" <noreply@snaplive.com>',
        to: email,
        subject: '✅ ¡Tu pago fue confirmado! - SnapLive',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed;">📸 SnapLive</h1>
                </div>
                
                <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">✅</span>
                    <h2 style="margin: 15px 0 5px 0;">¡Tu pago fue confirmado!</h2>
                    <p style="margin: 0; opacity: 0.9;">${formattedAmount}</p>
                </div>
                
                <p style="color: #333; font-size: 18px;">
                    Hola <strong>${userName}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    ¡Muchas gracias por usar nuestra web! Esperamos que disfrutes de tu evento y que captures los mejores momentos junto a tus invitados. 📷
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Ya podés crear tu evento y compartir el código QR con tus invitados para que suban sus fotos en tiempo real.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${dashboardLink}" 
                       style="background: linear-gradient(135deg, #7c3aed, #a855f7); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-size: 16px;
                              display: inline-block;">
                        Ir a Mi Panel
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © SnapLive - Compartí los mejores momentos
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        // Don't throw - payment was successful, email failure shouldn't break the flow
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendPaymentConfirmationEmail,
    isEmailConfigured
};
