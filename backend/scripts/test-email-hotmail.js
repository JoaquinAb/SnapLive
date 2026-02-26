/**
 * Test script para verificar que el email funciona con Hotmail/Outlook
 * Ejecutar: node scripts/test-email-hotmail.js
 */
require('dotenv').config();

const nodemailer = require('nodemailer');

async function testHotmailEmail() {
    console.log('\n📧 Testeando envío de email con Hotmail/Outlook...\n');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);
    console.log(`Pass: ${process.env.SMTP_PASS ? '***configurado***' : '❌ NO CONFIGURADO'}`);
    console.log('');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Error: SMTP_USER y SMTP_PASS deben estar configurados en el archivo .env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        }
    });

    try {
        // 1. Verificar conexión
        console.log('🔄 Verificando conexión SMTP...');
        await transporter.verify();
        console.log('✅ ¡Conexión SMTP exitosa!\n');

        // 2. Enviar email de prueba
        console.log('🔄 Enviando email de prueba...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `SnapLive <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Enviar a sí mismo para probar
            subject: '🧪 Test SnapLive - Email funcionando!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #7c3aed;">📸 SnapLive</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                        <span style="font-size: 48px;">✅</span>
                        <h2 style="margin: 15px 0 5px 0;">¡Email configurado correctamente!</h2>
                    </div>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Si estás leyendo este email, significa que la configuración de Hotmail/Outlook SMTP funciona correctamente.
                    </p>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Los siguientes emails están listos para enviarse:
                    </p>
                    
                    <ul style="color: #666; font-size: 16px;">
                        <li>🔐 Recuperación de contraseña</li>
                        <li>✅ Confirmación de pago</li>
                        <li>⚠️ Aviso de expiración de fotos</li>
                        <li>📦 Confirmación de eliminación de fotos</li>
                    </ul>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        © SnapLive - Email de prueba
                    </p>
                </div>
            `
        });

        console.log('✅ ¡Email de prueba enviado exitosamente!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Enviado a: ${process.env.SMTP_USER}`);
        console.log('\n🎉 ¡Todo funciona! Revisá tu bandeja de entrada (o spam).\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 Posibles soluciones:');
        console.log('   1. Verificá que tu email y contraseña son correctos');
        console.log('   2. Si usás Hotmail/Outlook, habilitá verificación en 2 pasos');
        console.log('      → https://account.microsoft.com/security');
        console.log('   3. Generá un "App Password" en:');
        console.log('      → https://account.microsoft.com/security → Contraseñas de aplicación');
        console.log('   4. Usá el App Password en vez de tu contraseña normal en SMTP_PASS');
        console.log('');
    }
}

testHotmailEmail();
