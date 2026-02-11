const QRCode = require('qrcode');
const cloudinary = require('../config/cloudinary');

/**
 * QR Code Service
 * Generates QR codes for event URLs
 */
class QRService {
    /**
     * Generate QR code and upload to Cloudinary
     * @param {string} eventSlug - Event slug
     * @param {string} frontendUrl - Frontend base URL
     * @returns {Promise<string>} - Cloudinary URL
     */
    static async generateAndUpload(eventSlug, frontendUrl = process.env.FRONTEND_URL) {
        // Fallback if env var is missing
        if (!frontendUrl) {
            console.warn('QRService: FRONTEND_URL not set, using default.');
            frontendUrl = 'https://snaplive.vercel.app';
        }

        // Ensure URL has protocol
        if (!frontendUrl.startsWith('http')) {
            frontendUrl = `https://${frontendUrl}`;
        }

        // Remove trailing slash if present
        if (frontendUrl.endsWith('/')) {
            frontendUrl = frontendUrl.slice(0, -1);
        }

        const eventUrl = `${frontendUrl}/event/${eventSlug}`;
        console.log(`[QR Service] Generating QR for URL: ${eventUrl}`);

        // Generate QR code as buffer
        const qrBuffer = await QRCode.toBuffer(eventUrl, {
            type: 'png',
            width: 500,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        // Upload to Cloudinary
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'snaplive/qrcodes',
                    public_id: `qr-${eventSlug}`,
                    resource_type: 'image'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result.secure_url);
                }
            );

            uploadStream.end(qrBuffer);
        });
    }

    /**
     * Generate QR code as base64 (for direct download)
     * @param {string} eventSlug - Event slug
     * @param {string} frontendUrl - Frontend base URL
     * @returns {Promise<string>} - Base64 data URL
     */
    static async generateBase64(eventSlug, frontendUrl = process.env.FRONTEND_URL) {
        // Fallback if env var is missing
        if (!frontendUrl) {
            frontendUrl = 'https://snaplive.vercel.app';
        }

        // Ensure URL has protocol
        if (!frontendUrl.startsWith('http')) {
            frontendUrl = `https://${frontendUrl}`;
        }

        // Remove trailing slash if present
        if (frontendUrl.endsWith('/')) {
            frontendUrl = frontendUrl.slice(0, -1);
        }

        const eventUrl = `${frontendUrl}/event/${eventSlug}`;
        console.log(`[QR Service] Generating Base64 QR for URL: ${eventUrl}`);

        return QRCode.toDataURL(eventUrl, {
            type: 'image/png',
            width: 500,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    }
}

module.exports = QRService;
