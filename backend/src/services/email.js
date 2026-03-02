const { google } = require('googleapis');

/**
 * Email Service
 * Handles sending emails for password reset, payment confirmation, etc.
 * 
 * Método 1: Gmail REST API via OAuth2 (RECOMENDADO - funciona en Railway)
 *   → Envía emails via HTTPS, NO necesita puertos SMTP
 * Método 2: SMTP clásico (fallback)
 *   → Se bloquea en hostings que cierran puertos SMTP (ej: Railway)
 * Método 3: Demo mode (sin credenciales)
 */

// Email transport mode
let emailMode = 'demo'; // 'gmail-api' | 'smtp' | 'demo'
let gmailClient = null;
let smtpTransporter = null;

const initializeEmail = () => {
    try {
        // 1. GMAIL REST API via OAuth2 (NO usa SMTP, usa HTTPS)
        if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                "https://developers.google.com/oauthplayground"
            );

            oauth2Client.setCredentials({
                refresh_token: process.env.GMAIL_REFRESH_TOKEN
            });

            gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
            emailMode = 'gmail-api';

            const user = process.env.GMAIL_USER || process.env.SMTP_USER;
            console.log(`📧 Email configurado con GMAIL REST API (${user}) — NO usa SMTP, envía via HTTPS`);
        }
        // 2. SMTP Clásico (fallback)
        else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const nodemailer = require('nodemailer');
            smtpTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.office365.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
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
            });
            emailMode = 'smtp';
            console.log(`📧 Email configurado con SMTP Clásico: ${process.env.SMTP_HOST} (${process.env.SMTP_USER})`);
        } else {
            console.log('⚠️ Email en MODO DEMO (sin credenciales de API ni SMTP)');
        }
    } catch (error) {
        console.error('❌ Error configurando email:', error);
    }
};

// Initialize on module load
initializeEmail();

// Check if email is configured
const isEmailConfigured = () => {
    return emailMode !== 'demo';
};

// Get the "from" address
const getFromAddress = () => {
    return process.env.SMTP_FROM || `SnapLive <${process.env.GMAIL_USER || process.env.SMTP_USER}>`;
};

/**
 * Build a raw RFC 2822 email string for the Gmail API
 */
const buildRawEmail = ({ from, to, subject, html }) => {
    const messageParts = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset="UTF-8"`,
        ``,
        html,
    ];

    return Buffer.from(messageParts.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

/**
 * Send an email
 * Uses Gmail REST API (HTTPS) or SMTP depending on config
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
        if (emailMode === 'gmail-api') {
            // Gmail REST API — envía via HTTPS, NO necesita puertos SMTP
            const from = getFromAddress();
            const raw = buildRawEmail({ from, to, subject, html });

            const result = await gmailClient.users.messages.send({
                userId: 'me',
                requestBody: { raw },
            });

            console.log(`✅ Email enviado via Gmail API a ${to} (ID: ${result.data.id})`);
            return { success: true, id: result.data.id };
        } else if (emailMode === 'smtp') {
            // SMTP clásico
            const info = await smtpTransporter.sendMail({
                from: getFromAddress(),
                to,
                subject,
                html
            });

            console.log(`✅ Email enviado via SMTP a ${to} (ID: ${info.messageId})`);
            return { success: true, id: info.messageId };
        }
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
