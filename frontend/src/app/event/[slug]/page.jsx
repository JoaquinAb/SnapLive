'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import PhotoUpload from '../../../components/PhotoUpload';
import PhotoGallery from '../../../components/PhotoGallery';
import { usePhotos } from '../../../hooks/usePhotos';

/**
 * Página de Evento para Invitados
 * Página pública para que los invitados suban y vean fotos
 */
export default function GuestEventPage() {
    const params = useParams();
    const slug = params.slug;

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('upload');

    const { photos, connected, addPhoto } = usePhotos(slug);

    // Verificar si el evento ya pasó
    const isEventFinished = useMemo(() => {
        if (!event?.eventDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(event.eventDate + 'T12:00:00');
        return eventDate < today;
    }, [event?.eventDate]);

    // Si el evento está finalizado, mostrar galería por defecto
    useEffect(() => {
        if (isEventFinished && activeTab === 'upload') {
            setActiveTab('gallery');
        }
    }, [isEventFinished, activeTab]);

    // Obtener detalles del evento
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await api.getEvent(slug);
                setEvent(data.event);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchEvent();
        }
    }, [slug]);

    const handleUploadComplete = (newPhotos) => {
        // Las fotos se agregan automáticamente via WebSocket
        // No las agregamos manualmente para evitar duplicados
        setActiveTab('gallery');
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-center" style={{
                minHeight: 'calc(100vh - 70px)',
                flexDirection: 'column',
                textAlign: 'center',
                padding: 'var(--space-xl)'
            }}>
                <span style={{ fontSize: '4rem' }}>😕</span>
                <h2 className="mt-lg">Evento No Encontrado</h2>
                <p className="text-muted">{error}</p>
            </div>
        );
    }

    return (
        <div className="guest-page" style={{ padding: 'var(--space-xl) 0' }}>
            <div className="container">
                {/* Encabezado del Evento */}
                <div className="text-center mb-xl slide-up">
                    <span style={{ fontSize: '3rem' }}>📸</span>
                    <h1 className="mt-lg">{event.name}</h1>
                    {isEventFinished ? (
                        <>
                            <span className="badge badge-secondary mt-lg" style={{ display: 'inline-flex' }}>
                                ✓ Evento Finalizado
                            </span>
                            <p className="text-muted mt-md">Este evento ya pasó. Podés ver las fotos en la galería.</p>
                        </>
                    ) : (
                        <>
                            <p className="text-muted">¡Compartí tus fotos con todos!</p>
                            {connected && (
                                <span className="badge badge-success mt-lg" style={{ display: 'inline-flex' }}>
                                    ● En Vivo
                                </span>
                            )}
                        </>
                    )}

                    {/* Días restantes para descargar */}
                    {(() => {
                        if (!event?.eventDate) return null;

                        // Si ya se limpiaron las fotos
                        if (event.photosCleanedAt) {
                            return (
                                <div style={{
                                    background: 'rgba(107, 114, 128, 0.15)',
                                    border: '1px solid rgba(107, 114, 128, 0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    marginTop: 'var(--space-md)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    fontSize: '0.85rem'
                                }}>
                                    📦 Las fotos de este evento ya no están disponibles
                                </div>
                            );
                        }

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const evDate = new Date(event.eventDate + 'T12:00:00');
                        const expirationDate = new Date(evDate);
                        expirationDate.setDate(expirationDate.getDate() + 60);
                        const diffMs = expirationDate - today;
                        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                        if (daysRemaining < 0) {
                            return (
                                <div style={{
                                    background: 'rgba(107, 114, 128, 0.15)',
                                    border: '1px solid rgba(107, 114, 128, 0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    marginTop: 'var(--space-md)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    fontSize: '0.85rem'
                                }}>
                                    📦 Las fotos de este evento ya no están disponibles
                                </div>
                            );
                        }

                        const isUrgent = daysRemaining <= 1;
                        const isWarning = daysRemaining <= 7;
                        const bgColor = isUrgent
                            ? 'rgba(239, 68, 68, 0.15)'
                            : isWarning
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(124, 58, 237, 0.1)';
                        const borderColor = isUrgent
                            ? 'rgba(239, 68, 68, 0.4)'
                            : isWarning
                                ? 'rgba(245, 158, 11, 0.4)'
                                : 'rgba(124, 58, 237, 0.25)';

                        return (
                            <div style={{
                                background: bgColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-sm) var(--space-md)',
                                marginTop: 'var(--space-md)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                fontSize: '0.85rem'
                            }}>
                                {isUrgent ? '🚨' : isWarning ? '⚠️' : '📅'} Fotos disponibles por <strong>{daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}</strong> más
                            </div>
                        );
                    })()}
                </div>

                {/* Navegación por Pestañas */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    {!isEventFinished && (
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            📷 Subir
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`btn ${activeTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        🖼️ Galería ({photos.length})
                    </button>
                </div>

                {/* Contenido */}
                {activeTab === 'upload' && !isEventFinished ? (
                    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <PhotoUpload
                            eventSlug={slug}
                            onUploadComplete={handleUploadComplete}
                        />
                    </div>
                ) : (
                    <PhotoGallery photos={photos} />
                )}
            </div>
        </div>
    );
}
