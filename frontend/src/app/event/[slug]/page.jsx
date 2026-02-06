'use client';
import { useState, useEffect } from 'react';
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
                    <p className="text-muted">¡Compartí tus fotos con todos!</p>
                    {connected && (
                        <span className="badge badge-success mt-lg" style={{ display: 'inline-flex' }}>
                            ● En Vivo
                        </span>
                    )}
                </div>

                {/* Navegación por Pestañas */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        📷 Subir
                    </button>
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`btn ${activeTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        🖼️ Galería ({photos.length})
                    </button>
                </div>

                {/* Contenido */}
                {activeTab === 'upload' ? (
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
