'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useWebSocket } from './useWebSocket';

/**
 * usePhotos hook for fetching and managing photos
 * @param {string} eventSlug - Event slug
 */
export function usePhotos(eventSlug) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    // Real-time updates
    const { connected, newPhotos, clearNewPhotos } = useWebSocket(eventSlug);

    // Fetch photos
    const fetchPhotos = useCallback(async (page = 1) => {
        if (!eventSlug) return;

        try {
            setLoading(true);
            const data = await api.getPhotos(eventSlug, page);
            setPhotos(data.photos);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventSlug]);

    // Initial fetch
    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    // Merge new photos from WebSocket
    useEffect(() => {
        if (newPhotos.length > 0) {
            setPhotos(prev => {
                // Filter out duplicates
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPhotos = newPhotos.filter(p => !existingIds.has(p.id));
                return [...uniqueNewPhotos, ...prev];
            });
            clearNewPhotos();
        }
    }, [newPhotos, clearNewPhotos]);

    /**
     * Add photo to list (optimistic update)
     */
    const addPhoto = useCallback((photo) => {
        setPhotos(prev => [photo, ...prev]);
    }, []);

    /**
     * Remove photo from list
     */
    const removePhoto = useCallback((photoId) => {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
    }, []);

    return {
        photos,
        loading,
        error,
        pagination,
        connected,
        fetchPhotos,
        addPhoto,
        removePhoto
    };
}
