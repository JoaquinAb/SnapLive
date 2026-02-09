const tf = require('@tensorflow/tfjs');
const nsfwjs = require('nsfwjs');
const sharp = require('sharp');

// Disable TF.js logging
tf.enableProdMode();

let model = null;
let modelLoading = false;

/**
 * Content Moderation Service
 * Uses NSFWJS to detect inappropriate content
 */
class ModerationService {
    /**
     * Load the NSFW model (lazy loading)
     */
    static async loadModel() {
        if (model) return model;

        if (modelLoading) {
            // Wait for model to load if another request is loading it
            while (modelLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return model;
        }

        modelLoading = true;
        try {
            console.log('🔍 Loading content moderation model...');
            model = await nsfwjs.load();
            console.log('✅ Content moderation model loaded');
            return model;
        } catch (error) {
            console.error('❌ Failed to load moderation model:', error);
            throw error;
        } finally {
            modelLoading = false;
        }
    }

    /**
     * Check if image contains inappropriate content
     * @param {Buffer} imageBuffer - Image buffer to check
     * @returns {Promise<{safe: boolean, reason?: string, predictions?: object}>}
     */
    static async checkImage(imageBuffer) {
        try {
            // Load model if not loaded
            const nsfwModel = await this.loadModel();

            // Resize image for faster processing (NSFWJS expects 224x224)
            const processedBuffer = await sharp(imageBuffer)
                .resize(224, 224, { fit: 'cover' })
                .removeAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Create tensor from image
            const { data, info } = processedBuffer;
            const numChannels = 3;
            const numPixels = info.width * info.height;
            const values = new Float32Array(numPixels * numChannels);

            for (let i = 0; i < numPixels; i++) {
                for (let c = 0; c < numChannels; c++) {
                    values[i * numChannels + c] = data[i * numChannels + c];
                }
            }

            const imageTensor = tf.tensor3d(values, [info.height, info.width, numChannels]);

            // Get predictions
            const predictions = await nsfwModel.classify(imageTensor);

            // Clean up tensor
            imageTensor.dispose();

            // Convert predictions to object
            const scores = {};
            predictions.forEach(p => {
                scores[p.className] = p.probability;
            });

            // Calculate NSFW score (Porn + Sexy + Hentai)
            const nsfwScore = (scores.Porn || 0) + (scores.Sexy || 0) + (scores.Hentai || 0);

            // Threshold: reject if NSFW content > 60%
            const THRESHOLD = 0.6;
            const isSafe = nsfwScore < THRESHOLD;

            if (!isSafe) {
                console.log(`🚫 Image rejected - NSFW score: ${(nsfwScore * 100).toFixed(1)}%`);
            }

            return {
                safe: isSafe,
                reason: isSafe ? null : 'Contenido inapropiado detectado',
                predictions: scores,
                nsfwScore: nsfwScore
            };
        } catch (error) {
            console.error('Error checking image:', error);
            // On error, allow the image (fail open)
            return { safe: true, error: error.message };
        }
    }

    /**
     * Preload the model at startup
     */
    static async preload() {
        try {
            await this.loadModel();
        } catch (error) {
            console.error('Failed to preload moderation model:', error);
        }
    }
}

module.exports = ModerationService;
