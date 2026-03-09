'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { usePhotos } from '../../../../hooks/usePhotos';

/**
 * Página de Modo Pantalla
 * Galería a pantalla completa para displays grandes con modo presentación
 * 
 * Parámetros URL para modo Resolume Arena:
 *   ?mode=resolume  → Activa modo Resolume (sin UI, fondo chroma, auto-slideshow)
 *   ?bg=green|black|transparent  → Color de fondo (default: green en resolume, black en normal)
 *   ?interval=N    → Intervalo de slideshow en segundos (default: 5)
 *   ?animation=fade|zoom|none  → Tipo de transición (default: fade)
 * 
 * Ejemplo: /event/mi-evento/screen?mode=resolume&bg=green&interval=4
 */
function ScreenModeContent() {
    const params = useParams();
    const slug = params.slug;
    const searchParams = useSearchParams();

    // Detectar modo Resolume desde URL
    const isResolumeMode = searchParams.get('mode') === 'resolume';
    const bgParam = searchParams.get('bg') || (isResolumeMode ? 'green' : 'black');
    const intervalParam = Number(searchParams.get('interval')) || 5;
    const animationParam = searchParams.get('animation') || 'fade';

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSlideshow, setIsSlideshow] = useState(isResolumeMode); // Auto-start en Resolume
    const [slideInterval, setSlideInterval] = useState(intervalParam);
    const [showControls, setShowControls] = useState(!isResolumeMode);
    const [viewMode, setViewMode] = useState(isResolumeMode ? 'fullscreen' : 'grid');

    const { photos, connected } = usePhotos(slug);

    // Obtener color de fondo según parámetro
    const getBgColor = () => {
        switch (bgParam) {
            case 'green': return '#00ff00';
            case 'transparent': return 'transparent';
            case 'black': return '#000000';
            default: return isResolumeMode ? '#00ff00' : 'var(--color-bg-primary)';
        }
    };

    // Obtener evento
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await api.getEvent(slug);
                setEvent(data.event);
            } catch (err) {
                console.error('Error al obtener evento:', err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchEvent();
    }, [slug]);

    // Efecto de presentación automática
    useEffect(() => {
        if (!isSlideshow || photos.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % photos.length);
        }, slideInterval * 1000);

        return () => clearInterval(timer);
    }, [isSlideshow, photos.length, slideInterval]);

    // Resetear a la foto más nueva cuando llegan fotos nuevas
    useEffect(() => {
        if (photos.length > 0 && !isSlideshow && viewMode === 'grid') {
            setCurrentIndex(0);
        }
    }, [photos.length, isSlideshow, viewMode]);

    // Navegación con teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (viewMode !== 'fullscreen') return;

            switch (e.key) {
                case 'ArrowLeft':
                    setCurrentIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                    break;
                case 'ArrowRight':
                    setCurrentIndex(prev => (prev + 1) % photos.length);
                    break;
                case 'Escape':
                    setViewMode('grid');
                    setIsSlideshow(false);
                    break;
                case ' ':
                    e.preventDefault();
                    setIsSlideshow(prev => !prev);
                    break;
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                setViewMode('grid');
                setIsSlideshow(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [viewMode, photos.length]);

    // Ocultar controles automáticamente en fullscreen
    useEffect(() => {
        if (viewMode !== 'fullscreen' || !isSlideshow) {
            setShowControls(true);
            return;
        }

        const timer = setTimeout(() => setShowControls(false), 3000);
        return () => clearTimeout(timer);
    }, [viewMode, isSlideshow, currentIndex]);

    // Abrir foto en fullscreen
    const openFullscreen = useCallback((index) => {
        setCurrentIndex(index);
        setViewMode('fullscreen');
    }, []);

    // Iniciar presentación automática con pantalla completa del navegador
    const startSlideshow = useCallback(() => {
        setViewMode('fullscreen');
        setIsSlideshow(true);
        setCurrentIndex(0);

        // Activar pantalla completa del navegador
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }, []);

    // Salir de fullscreen
    const exitFullscreen = useCallback(() => {
        setViewMode('grid');
        setIsSlideshow(false);

        // Salir de pantalla completa del navegador
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
        }
    }, []);

    if (loading) {
        return (
            <div className="screen-mode flex-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div
            className="screen-mode"
            style={{
                position: 'fixed',
                inset: 0,
                background: getBgColor(),
                overflow: 'hidden'
            }}
            onMouseMove={() => viewMode === 'fullscreen' && !isResolumeMode && setShowControls(true)}
        >
            {/* Encabezado - oculto en modo Resolume */}
            {!isResolumeMode && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: 'var(--space-lg)',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 10,
                    opacity: viewMode === 'fullscreen' && !showControls ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem' }}>📸 {event?.name}</h2>
                        <p className="text-muted">{photos.length} fotos</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                        {connected && (
                            <span className="badge badge-success">● En Vivo</span>
                        )}

                        {/* Selector de intervalo */}
                        <select
                            value={slideInterval}
                            onChange={(e) => setSlideInterval(Number(e.target.value))}
                            style={{
                                background: '#1a1a2e',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-sm) var(--space-md)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value={3} style={{ background: '#1a1a2e', color: 'white' }}>3 seg</option>
                            <option value={5} style={{ background: '#1a1a2e', color: 'white' }}>5 seg</option>
                            <option value={8} style={{ background: '#1a1a2e', color: 'white' }}>8 seg</option>
                            <option value={10} style={{ background: '#1a1a2e', color: 'white' }}>10 seg</option>
                            <option value={15} style={{ background: '#1a1a2e', color: 'white' }}>15 seg</option>
                        </select>

                        {viewMode === 'fullscreen' ? (
                            <>
                                <button
                                    onClick={() => setIsSlideshow(!isSlideshow)}
                                    className={`btn btn-sm ${isSlideshow ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {isSlideshow ? '⏸️ Pausar' : '▶️ Reproducir'}
                                </button>
                                <button
                                    onClick={exitFullscreen}
                                    className="btn btn-sm btn-secondary"
                                >
                                    ✕ Salir
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={startSlideshow}
                                className="btn btn-sm btn-primary"
                                disabled={photos.length === 0}
                            >
                                ▶️ Iniciar Presentación
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Contenido Principal */}
            {photos.length === 0 ? (
                isResolumeMode ? (
                    /* En Resolume, mostrar solo el fondo chroma cuando no hay fotos */
                    <div style={{ height: '100%' }} />
                ) : (
                    <div className="flex-center" style={{ height: '100%', flexDirection: 'column' }}>
                        <span style={{ fontSize: '6rem' }}>📷</span>
                        <h2 className="mt-xl">Esperando fotos...</h2>
                        <p className="text-muted">¡Escaneá el código QR para empezar a subir!</p>
                        <div className="pulse mt-xl">
                            <div className="spinner"></div>
                        </div>
                    </div>
                )
            ) : isResolumeMode ? (
                /* Vista Resolume Arena - foto limpia sobre fondo chroma */
                <div
                    style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px'
                    }}
                >
                    <img
                        key={photos[currentIndex]?.id}
                        src={photos[currentIndex]?.url}
                        alt=""
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            borderRadius: '0',
                            animation: animationParam === 'none' ? 'none' :
                                animationParam === 'zoom' ? 'resolumeZoom 0.6s ease' :
                                    'resolumeFade 0.6s ease'
                        }}
                    />
                </div>
            ) : viewMode === 'fullscreen' ? (
                /* Vista Fullscreen / Presentación (modo proyector normal) */
                <div
                    style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--space-3xl)',
                        cursor: showControls ? 'default' : 'none'
                    }}
                    onClick={() => setShowControls(true)}
                >
                    {/* Botón anterior */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                        }}
                        style={{
                            position: 'absolute',
                            left: 'var(--space-xl)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            opacity: showControls ? 1 : 0,
                            transition: 'opacity 0.3s ease',
                            zIndex: 5
                        }}
                    >
                        ‹
                    </button>

                    {/* Imagen actual con transición - formato cuadrado uniforme */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: 'min(85vh, 85vw)',
                            height: 'min(85vh, 85vw)',
                            aspectRatio: '1 / 1',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-lg)',
                            animation: 'fadeIn 0.5s ease'
                        }}>
                            <img
                                key={photos[currentIndex]?.id}
                                src={photos[currentIndex]?.url}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </div>

                    {/* Botón siguiente */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(prev => (prev + 1) % photos.length);
                        }}
                        style={{
                            position: 'absolute',
                            right: 'var(--space-xl)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            opacity: showControls ? 1 : 0,
                            transition: 'opacity 0.3s ease',
                            zIndex: 5
                        }}
                    >
                        ›
                    </button>

                    {/* Info de la foto */}
                    <div style={{
                        position: 'absolute',
                        bottom: 'var(--space-xl)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.7)',
                        padding: 'var(--space-sm) var(--space-lg)',
                        borderRadius: 'var(--radius-full)',
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}>
                        <p>📷 {photos[currentIndex]?.uploaderName || 'Anónimo'} • {currentIndex + 1} de {photos.length}</p>
                    </div>

                    {/* Barra de progreso para auto-play */}
                    {isSlideshow && (
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'rgba(255,255,255,0.2)'
                        }}>
                            <div
                                key={currentIndex}
                                style={{
                                    height: '100%',
                                    background: 'var(--color-primary)',
                                    animation: `progressBar ${slideInterval}s linear`
                                }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                /* Vista de Grilla */
                <div style={{
                    height: '100%',
                    overflow: 'auto',
                    padding: 'calc(80px + var(--space-lg)) var(--space-lg) var(--space-lg)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--space-lg)'
                    }}>
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                className="gallery-item fade-in"
                                onClick={() => openFullscreen(index)}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    aspectRatio: '1',
                                    borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <img
                                    src={photo.thumbnailUrl || photo.url}
                                    alt=""
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Indicador de reproducción automática - removido porque molestaba */}

            {/* CSS para animaciones */}
            <style jsx>{`
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }
                @keyframes resolumeFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes resolumeZoom {
                    from { opacity: 0; transform: scale(0.85); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

/**
 * Página principal con Suspense (necesario por useSearchParams)
 */
export default function ScreenModePage() {
    return (
        <Suspense fallback={
            <div className="screen-mode flex-center" style={{ position: 'fixed', inset: 0, background: '#000' }}>
                <div className="spinner"></div>
            </div>
        }>
            <ScreenModeContent />
        </Suspense>
    );
}
