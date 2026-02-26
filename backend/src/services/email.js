const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for password reset, payment confirmation, etc.
 * Uses Nodemailer with SMTP (Hotmail/Outlook/Gmail)
 * Supports demo mode when no SMTP credentials are configured
 */

// Initialize Nodemailer transporter
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.office365.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        debug: true, // Show SMTP traffic in logs
        logger: true // Log information into console
    });
    console.log(`📧 Email configurado con SMTP: ${process.env.SMTP_HOST || 'smtp.office365.com'} (${process.env.SMTP_USER})`);
} else {
    console.log('⚠️ Email en MODO DEMO (sin credenciales SMTP configuradas)');
}

// Check if email is configured
const isEmailConfigured = () => {
    return !!transporter;
};

// Get the "from" address
const getFromAddress = () => {
    return process.env.SMTP_FROM || `SnapLive <${process.env.SMTP_USER}>`;
};

/**
 * Send an email using Nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML body
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
const sendEmail = async ({ to, subject, html }) => {
    if (!isEmailConfigured()) {
        return null; // Will be handled by caller's demo mode
    }

    try {
        const info = await transporter.sendMail({
            from: getFromAddress(),
            to,
            subject,
            html
        });

        console.log(`✅ Email enviado a ${to} (ID: ${info.messageId})`);
        return { success: true, id: info.messageId };
    } catch (error) {
        console.error(`❌ Error enviando email a ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @returns {Promise<{success: boolean, demo?: boolean, resetLink?: string}>}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Demo mode (no SMTP credentials)
    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MODO DEMO (Sin SMTP) - EMAIL DE RECUPERACIÓN');
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Link de recuperación: ${resetLink}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true, resetLink };
    }

    const result = await sendEmail({
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
    });

    if (!result || !result.success) {
        // Fallback to demo mode
        console.log('\n' + '='.repeat(60));
        console.log('⚠️ FALLO ENVÍO REAL - ACTIVANDO MODO FALLBACK');
        console.log(`Error: ${result?.error || 'Unknown'}`);
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Link de recuperación: ${resetLink}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true, resetLink };
    }

    return { success: true, id: result.id };
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

    // Demo mode
    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MODO DEMO (Sin SMTP) - EMAIL DE CONFIRMACIÓN DE PAGO');
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Usuario: ${userName}`);
        console.log(`Monto: ${formattedAmount}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true };
    }

    const result = await sendEmail({
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
    });

    if (!result || !result.success) {
        console.log('\n' + '='.repeat(60));
        console.log('⚠️ FALLO ENVÍO REAL - PAGO CONFIRMADO (SOLO LOG)');
        console.log(`Error: ${result?.error || 'Unknown'}`);
        console.log(`Para: ${email}`);
        console.log('='.repeat(60) + '\n');
        return { success: false, error: result?.error };
    }

    return { success: true, id: result.id };
};

/**
 * Send photo expiration warning email
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @param {string} eventName - Event name
 * @param {number} daysLeft - Days until photos are deleted
 * @param {string} downloadLink - Link to download photos
 */
const sendExpirationWarningEmail = async (email, userName, eventName, daysLeft, downloadLink) => {
    const isUrgent = daysLeft <= 1;
    const subject = isUrgent
        ? `🚨 ¡ÚLTIMO DÍA! Tus fotos de "${eventName}" se eliminan mañana`
        : `⚠️ Tus fotos de "${eventName}" se eliminan en ${daysLeft} días`;

    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log(`📧 MODO DEMO - AVISO DE EXPIRACIÓN (${daysLeft} días)`);
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Evento: ${eventName}`);
        console.log(`Días restantes: ${daysLeft}`);
        console.log(`Link: ${downloadLink}`);
        console.log('='.repeat(60) + '\n');
        return { success: true, demo: true };
    }

    const result = await sendEmail({
        to: email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed;">📸 SnapLive</h1>
                </div>
                
                <div style="background: ${isUrgent ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}; color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">${isUrgent ? '🚨' : '⚠️'}</span>
                    <h2 style="margin: 15px 0 5px 0;">
                        ${isUrgent ? '¡Último día para descargar tus fotos!' : `Tus fotos se eliminan en ${daysLeft} días`}
                    </h2>
                    <p style="margin: 0; opacity: 0.9;">Evento: ${eventName}</p>
                </div>
                
                <p style="color: #333; font-size: 18px;">
                    Hola <strong>${userName}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Te recordamos que las fotos de tu evento <strong>"${eventName}"</strong> se eliminarán automáticamente en <strong>${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}</strong> para liberar espacio de almacenamiento.
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Si todavía no descargaste tus fotos, <strong>hacelo ahora</strong> antes de que sean eliminadas permanentemente.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${downloadLink}" 
                       style="background: linear-gradient(135deg, #7c3aed, #a855f7); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-size: 16px;
                              display: inline-block;">
                        📥 Descargar Mis Fotos
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © SnapLive - Compartí los mejores momentos
                </p>
            </div>
        `
    });

    if (!result || !result.success) {
        console.error('Nodemailer error (expiration warning):', result?.error);
        return { success: false, error: result?.error };
    }
    return { success: true, id: result.id };
};

/**
 * Send photos deleted confirmation email
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @param {string} eventName - Event name
 */
const sendPhotosDeletedEmail = async (email, userName, eventName) => {
    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MODO DEMO - FOTOS ELIMINADAS');
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Evento: ${eventName}`);
        console.log('='.repeat(60) + '\n');
        return { success: true, demo: true };
    }

    const result = await sendEmail({
        to: email,
        subject: `📦 Fotos de "${eventName}" eliminadas - SnapLive`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed;">📸 SnapLive</h1>
                </div>
                
                <div style="background: linear-gradient(135deg, #6b7280, #4b5563); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">📦</span>
                    <h2 style="margin: 15px 0 5px 0;">Fotos eliminadas</h2>
                    <p style="margin: 0; opacity: 0.9;">Evento: ${eventName}</p>
                </div>
                
                <p style="color: #333; font-size: 18px;">
                    Hola <strong>${userName}</strong>,
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Te informamos que las fotos de tu evento <strong>"${eventName}"</strong> fueron eliminadas automáticamente después de 60 días, como parte de nuestra política de almacenamiento.
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    ¡Gracias por usar SnapLive! Esperamos verte de nuevo en tu próximo evento. 🎉
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © SnapLive - Compartí los mejores momentos
                </p>
            </div>
        `
    });

    if (!result || !result.success) {
        console.error('Nodemailer error (photos deleted):', result?.error);
        return { success: false, error: result?.error };
    }
    return { success: true, id: result.id };
};

module.exports = {
    sendPasswordResetEmail,
    sendPaymentConfirmationEmail,
    sendExpirationWarningEmail,
    sendPhotosDeletedEmail,
    isEmailConfigured
};
