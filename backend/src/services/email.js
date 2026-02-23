const { Resend } = require('resend');

/**
 * Email Service
 * Handles sending emails for password reset, etc.
 * Supports demo mode when no API key is configured or when sending fails
 */

// Initialize Resend
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// Check if email is configured
const isEmailConfigured = () => {
    return !!resend;
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

    // Demo mode (no API key) - just log to console
    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MODO DEMO (Sin API Key) - EMAIL DE RECUPERACIÓN');
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Link de recuperación: ${resetLink}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true, resetLink };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'SnapLive <onboarding@resend.dev>', // Use default testing domain until custom domain is verified
            to: [email],
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

        if (error) {
            console.error('Resend error:', error);
            // Fallback to demo mode if sending fails (e.g. unverified domain)
            console.log('\n' + '='.repeat(60));
            console.log('⚠️ FALLO ENVÍO REAL - ACTIVANDO MODO FALLBACK');
            console.log(`Error: ${error.message}`);
            console.log('='.repeat(60));
            console.log(`Para: ${email}`);
            console.log(`Link de recuperación: ${resetLink}`);
            console.log('='.repeat(60) + '\n');

            return { success: true, demo: true, resetLink };
        }

        return { success: true, id: data.id };
    } catch (error) {
        console.error('Exception sending email:', error);
        // Fallback to demo mode on exception
        console.log('\n' + '='.repeat(60));
        console.log('⚠️ EXCEPCIÓN ENVÍO REAL - ACTIVANDO MODO FALLBACK');
        console.log(`Error: ${error.message}`);
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Link de recuperación: ${resetLink}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true, resetLink };
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

    // Demo mode (no API key)
    if (!isEmailConfigured()) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 MODO DEMO (Sin API Key) - EMAIL DE CONFIRMACIÓN DE PAGO');
        console.log('='.repeat(60));
        console.log(`Para: ${email}`);
        console.log(`Usuario: ${userName}`);
        console.log(`Monto: ${formattedAmount}`);
        console.log('='.repeat(60) + '\n');

        return { success: true, demo: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'SnapLive <onboarding@resend.dev>', // Use default testing domain until custom domain is verified
            to: [email],
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

        if (error) {
            console.error('Resend error:', error);
            // Fallback for payments
            console.log('\n' + '='.repeat(60));
            console.log('⚠️ FALLO ENVÍO REAL - PAGO CONFIRMADO (SOLO LOG)');
            console.log(`Error: ${error.message}`);
            console.log(`Para: ${email}`);
            console.log('='.repeat(60) + '\n');
            return { success: false, error: error.message }; // Keep payment failure as real failure or handle upstream?
            // Actually, for payments, we usually WANT to know if email failed, but not block the UI.
            // But for now, let's just log and return error so backend knows.
        }

        return { success: true, id: data.id };
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return { success: false, error: error.message };
    }
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

    try {
        const { data, error } = await resend.emails.send({
            from: 'SnapLive <onboarding@resend.dev>',
            to: [email],
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

        if (error) {
            console.error('Resend error (expiration warning):', error);
            return { success: false, error: error.message };
        }
        return { success: true, id: data.id };
    } catch (error) {
        console.error('Error sending expiration warning email:', error);
        return { success: false, error: error.message };
    }
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

    try {
        const { data, error } = await resend.emails.send({
            from: 'SnapLive <onboarding@resend.dev>',
            to: [email],
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

        if (error) {
            console.error('Resend error (photos deleted):', error);
            return { success: false, error: error.message };
        }
        return { success: true, id: data.id };
    } catch (error) {
        console.error('Error sending photos deleted email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendPaymentConfirmationEmail,
    sendExpirationWarningEmail,
    sendPhotosDeletedEmail,
    isEmailConfigured
};
