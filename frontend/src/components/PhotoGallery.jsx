'use client';
import { useState, useEffect } from 'react';

/**
 * Componente PhotoGallery
 * Grilla de fotos responsive con lightbox
 */
export default function PhotoGallery({ photos, onDeletePhoto, canDelete = false }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Índices y navegación
    const currentIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : -1;
    const hasNext = currentIndex < photos.length - 1;
    const hasPrev = currentIndex > 0;

    const handleNext = (e) => {
        e?.stopPropagation();
        if (hasNext) {
            setSelectedPhoto(photos[currentIndex + 1]);
        }
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        if (hasPrev) {
            setSelectedPhoto(photos[currentIndex - 1]);
        }
    };

    // Navegación con teclado
    useEffect(() => {
        if (!selectedPhoto) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setSelectedPhoto(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto, photos]);

    if (!photos || photos.length === 0) {
        return (
            <div className="text-center" style={{ padding: 'var(--space-3xl)' }}>
                <span style={{ fontSize: '4rem' }}>📷</span>
                <h3 className="mt-lg">Todavía no hay fotos</h3>
                <p className="text-muted">¡Sé el primero en subir una foto!</p>
            </div>
        );
    }

    return (
        <>
            <div className="gallery-grid">
                {photos.map((photo, index) => (
                    <div
                        key={photo.id}
                        className="gallery-item fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <img
                            src={photo.thumbnailUrl || photo.url}
                            alt={`Foto de ${photo.uploaderName || 'Anónimo'}`}
                            loading="lazy"
                        />
                        <div className="gallery-item-overlay">
                            <div style={{
                                position: 'absolute',
                                bottom: 'var(--space-md)',
                                left: 'var(--space-md)',
                                right: 'var(--space-md)'
                            }}>
                                <p style={{ fontSize: '0.875rem', color: 'white' }}>
                                    📷 {photo.uploaderName || 'Anónimo'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
                <div
                    className="lightbox"
                    onClick={() => setSelectedPhoto(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--space-xl)',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 'var(--space-lg)',
                        right: 'var(--space-lg)',
                        display: 'flex',
                        gap: 'var(--space-md)',
                        zIndex: 10
                    }}>
                        {/* Download Button */}
                        {canDelete && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        const response = await fetch(selectedPhoto.url);
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `snaplive-${selectedPhoto.id}.jpg`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                    } catch (err) {
                                        console.error('Error downloading photo:', err);
                                        alert('Error al descargar la foto');
                                    }
                                }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                                title="Descargar"
                            >
                                📥
                            </button>
                        )}

                        <button
                            onClick={() => setSelectedPhoto(null)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '2rem',
                                cursor: 'pointer',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                lineHeight: '1'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Botón Anterior */}
                    {hasPrev && (
                        <button
                            onClick={handlePrev}
                            style={{
                                position: 'absolute',
                                left: 'var(--space-lg)',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '3rem',
                                cursor: 'pointer',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                zIndex: 10,
                                userSelect: 'none'
                            }}
                        >
                            ‹
                        </button>
                    )}

                    {/* Botón Siguiente */}
                    {hasNext && (
                        <button
                            onClick={handleNext}
                            style={{
                                position: 'absolute',
                                right: 'var(--space-lg)',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '3rem',
                                cursor: 'pointer',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                zIndex: 10,
                                userSelect: 'none'
                            }}
                        >
                            ›
                        </button>
                    )}
                    <img
                        src={selectedPhoto.url}
                        alt={`Foto de ${selectedPhoto.uploaderName || 'Anónimo'}`}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            borderRadius: 'var(--radius-md)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    {canDelete && onDeletePhoto && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeletePhoto(selectedPhoto.id);
                                setSelectedPhoto(null);
                            }}
                            className="btn btn-secondary"
                            style={{
                                position: 'absolute',
                                bottom: 'var(--space-xl)',
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }}
                        >
                            🗑️ Eliminar Foto
                        </button>
                    )}
                    <div style={{
                        position: 'absolute',
                        bottom: 'var(--space-xl)',
                        left: 'var(--space-xl)',
                        color: 'white'
                    }}>
                        <p>📷 {selectedPhoto.uploaderName || 'Anónimo'}</p>
                    </div>
                </div>
            )}
        </>
    );
}
