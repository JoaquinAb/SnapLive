require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

// Este script te ayudará a obtener el REFRESH_TOKEN necesario para
// enviar mails usando la API de Gmail (sin SMTP).
//
// Requisitos previos:
// 1. Ir a https://console.cloud.google.com/
// 2. Crear un proyecto y buscar "Gmail API" y activarla.
// 3. Ir a "Credenciales" -> Crear Credenciales -> "ID de cliente de OAuth".
// 4. Elegir "Aplicación web". En orígenes dejar vacío, en 
//    "URI de redireccionamiento autorizados" poner: https://developers.google.com/oauthplayground
// 5. Copiar el Client ID y Client Secret abajo o en tu .env

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'PEGÁ_TU_CLIENT_ID_ACÁ';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'PEGÁ_TU_CLIENT_SECRET_ACÁ';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://mail.google.com/'];

function getAccessToken() {
    if (CLIENT_ID.includes('PEGÁ_') || CLIENT_SECRET.includes('PEGÁ_')) {
        console.log('❌ ERROR: Tenés que reemplazar los valores de CLIENT_ID y CLIENT_SECRET en este archivo o en tu .env primero.');
        process.exit(1);
    }

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Fuerza a que siempre devuelva el refresh_token
    });

    console.log('===============================================================');
    console.log('🔑 AUTORIZACIÓN DE GMAIL API');
    console.log('===============================================================');
    console.log('1. Abrí el siguiente link en tu navegador:');
    console.log('\n', authUrl, '\n');
    console.log('2. Iniciá sesión con tu cuenta: snaplive.web@gmail.com');
    console.log('3. Dale click en "Continuar" / "Permitir" a todos los permisos.');
    console.log('4. Te va a llevar a una página (OAuth Playground o un error), copiá la URL de arriba.');
    console.log('5. La URL va a tener un parámetro ?code=... Copiá TODO ese código y pegalo abajo.');
    console.log('===============================================================');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('👉 Pegá el código acá: ', (code) => {
        rl.close();

        // Si pegaron la URL entera, extraer solo el código
        if (code.includes('code=')) {
            code = new URL(code).searchParams.get('code') || code;
        }

        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('❌ Error al obtener el token:', err.message);
                return;
            }

            console.log('\n✅ ¡ÉXITO! Se generaron las credenciales.\n');
            console.log('Agregá estas 3 variables a tu .env y a Railway:\n');
            console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
            console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
            console.log(`GMAIL_REFRESH_TOKEN=${token.refresh_token}`);
            console.log('\nY borrá las viejas variables SMTP (SMTP_PORT, SMTP_PASS, etc).');
        });
    });
}

getAccessToken();
