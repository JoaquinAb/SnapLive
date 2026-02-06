'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

/**
 * useWebSocket hook for real-time photo updates
 * @param {string} eventSlug - Event to subscribe to
 */
export function useWebSocket(eventSlug) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [newPhotos, setNewPhotos] = useState([]);

    useEffect(() => {
        if (!eventSlug) return;

        // Connect to WebSocket server
        socketRef.current = io(WS_URL, {
            transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);
            // Join event room
            socketRef.current.emit('join-event', eventSlug);
        });

        socketRef.current.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        });

        // Listen for new photos
        socketRef.current.on('new-photo', (photo) => {
            console.log('New photo received:', photo);

            // Filter by eventSlug if available to prevent cross-talk
            if (photo.eventSlug && photo.eventSlug !== eventSlug) {
                console.warn(`received photo for different event: ${photo.eventSlug} (expected: ${eventSlug})`);
                return;
            }

            setNewPhotos(prev => [photo, ...prev]);
        });

        // Cleanup
        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-event', eventSlug);
                socketRef.current.disconnect();
            }
        };
    }, [eventSlug]);

    /**
     * Clear new photos (after they've been merged with main list)
     */
    const clearNewPhotos = useCallback(() => {
        setNewPhotos([]);
    }, []);

    return { connected, newPhotos, clearNewPhotos };
}
