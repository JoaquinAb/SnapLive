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
        // Ensure URL has protocol
        if (frontendUrl && !frontendUrl.startsWith('http')) {
            frontendUrl = `https://${frontendUrl}`;
        }

        const eventUrl = `${frontendUrl}/event/${eventSlug}`;

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
        // Ensure URL has protocol
        if (frontendUrl && !frontendUrl.startsWith('http')) {
            frontendUrl = `https://${frontendUrl}`;
        }

        const eventUrl = `${frontendUrl}/event/${eventSlug}`;

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
