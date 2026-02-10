const { Server } = require('socket.io');

/**
 * WebSocket Service
 * Handles real-time photo updates
 */
class WebSocketService {
    constructor() {
        this.io = null;
    }

    /**
     * Initialize Socket.io with HTTP server
     * @param {object} httpServer - HTTP server instance
     */
    init(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: (origin, callback) => {
                    const allowedOrigins = [
                        process.env.FRONTEND_URL,
                        'http://localhost:3000'
                    ];

                    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            // Join event room
            socket.on('join-event', (eventSlug) => {
                socket.join(`event:${eventSlug}`);
                console.log(`${socket.id} joined event: ${eventSlug}`);
            });

            // Leave event room
            socket.on('leave-event', (eventSlug) => {
                socket.leave(`event:${eventSlug}`);
                console.log(`${socket.id} left event: ${eventSlug}`);
            });

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });

        console.log('WebSocket server initialized');
    }

    /**
     * Emit new photo to all clients viewing an event
     * @param {string} eventSlug - Event slug
     * @param {object} photo - Photo data
     */
    emitNewPhoto(eventSlug, photo) {
        if (this.io) {
            this.io.to(`event:${eventSlug}`).emit('new-photo', photo);
        }
    }

    /**
     * Emit photo deleted to all clients viewing an event
     * @param {string} eventSlug - Event slug
     * @param {string} photoId - Deleted photo ID
     */
    emitPhotoDeleted(eventSlug, photoId) {
        if (this.io) {
            this.io.to(`event:${eventSlug}`).emit('photo-deleted', photoId);
        }
    }
}

// Singleton instance
const wsService = new WebSocketService();

module.exports = wsService;
