const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Demo mode - use local storage if Cloudinary is not configured
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

const DEMO_MODE = !isCloudinaryConfigured;

// Only load Cloudinary if not in demo mode
let cloudinary = null;
if (!DEMO_MODE) {
    try {
        cloudinary = require('../config/cloudinary');
    } catch (e) {
        console.error('Failed to load Cloudinary config:', e);
        // Fallback to demo mode if config fails
    }
}

/**
 * Image Service
 * Handles image optimization and upload to Cloudinary or local storage
 */
class ImageService {
    /**
     * Optimize and upload image
     * @param {Buffer} buffer - Image buffer from multer
     * @param {string} eventId - Event ID for folder organization
     * @returns {Promise<{url: string, thumbnailUrl: string, publicId: string}>}
     */
    static async uploadPhoto(buffer, eventId) {
        // Optimize image with Sharp
        const optimizedBuffer = await sharp(buffer)
            .resize(1920, 1920, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Create thumbnail
        const thumbnailBuffer = await sharp(buffer)
            .resize(400, 400, {
                fit: 'cover'
            })
            .jpeg({ quality: 70 })
            .toBuffer();

        // Use demo mode (local storage) or Cloudinary
        if (DEMO_MODE || !cloudinary) {
            console.log('Using local storage (Demo Mode)');
            return await this.uploadToLocal(optimizedBuffer, thumbnailBuffer, eventId);
        } else {
            try {
                // Upload main image
                const mainUploadPromise = this.uploadToCloudinaryStream(
                    optimizedBuffer,
                    `snaplive/events/${eventId}`
                );

                // Upload thumbnail
                const thumbUploadPromise = this.uploadToCloudinaryStream(
                    thumbnailBuffer,
                    `snaplive/events/${eventId}/thumbnails`
                );

                const [mainUpload, thumbUpload] = await Promise.all([mainUploadPromise, thumbUploadPromise]);

                return {
                    url: mainUpload.secure_url,
                    thumbnailUrl: thumbUpload.secure_url,
                    publicId: mainUpload.public_id
                };
            } catch (error) {
                console.error('Cloudinary upload failed, falling back to local storage:', error);
                return await this.uploadToLocal(optimizedBuffer, thumbnailBuffer, eventId);
            }
        }
    }

    /**
     * Upload to local storage (demo mode)
     * @param {Buffer} mainBuffer - Optimized image buffer
     * @param {Buffer} thumbBuffer - Thumbnail buffer
     * @param {string} eventId - Event ID
     * @returns {Promise<{url: string, thumbnailUrl: string, publicId: string}>}
     */
    static async uploadToLocal(mainBuffer, thumbBuffer, eventId) {
        const publicDir = path.join(__dirname, '../../public/uploads', eventId);
        const thumbDir = path.join(publicDir, 'thumbnails');

        // Create directories if they don't exist
        await fs.mkdir(publicDir, { recursive: true });
        await fs.mkdir(thumbDir, { recursive: true });

        const fileName = `${uuidv4()}.jpg`;
        const mainPath = path.join(publicDir, fileName);
        const thumbPath = path.join(thumbDir, fileName);

        // Write files
        await fs.writeFile(mainPath, mainBuffer);
        await fs.writeFile(thumbPath, thumbBuffer);

        // Return URLs relative to server
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return {
            url: `${baseUrl}/uploads/${eventId}/${fileName}`,
            thumbnailUrl: `${baseUrl}/uploads/${eventId}/thumbnails/${fileName}`,
            publicId: `local_${eventId}_${fileName}`
        };
    }

    /**
     * Upload buffer to Cloudinary using stream
     * @param {Buffer} buffer - Image buffer
     * @param {string} folder - Cloudinary folder
     * @returns {Promise<object>} - Cloudinary upload result
     */
    static uploadToCloudinaryStream(buffer, folder) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'image'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(buffer);
        });
    }

    /**
     * Delete image
     * @param {string} publicId - Image public ID
     */
    static async deletePhoto(publicId) {
        try {
            if (publicId.startsWith('local_')) {
                // Demo mode - delete local file
                const parts = publicId.replace('local_', '').split('_');
                const eventId = parts[0];
                const fileName = parts.slice(1).join('_');
                const mainPath = path.join(__dirname, '../../public/uploads', eventId, fileName);
                const thumbPath = path.join(__dirname, '../../public/uploads', eventId, 'thumbnails', fileName);

                await fs.unlink(mainPath).catch(() => { });
                await fs.unlink(thumbPath).catch(() => { });
            } else if (cloudinary) {
                // Cloudinary mode
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }
}

module.exports = ImageService;
