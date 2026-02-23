'use client';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

/**
 * Landing Page
 * Página de inicio moderna y visualmente atractiva
 * Redirige a /dashboard si el usuario ya está autenticado
 */
export default function HomePage() {
    const { isAuthenticated, loading } = useAuth();
    const ctaHref = isAuthenticated ? '/dashboard' : '/register';
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero" style={{
                minHeight: 'calc(100vh - 70px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 'var(--space-xl)'
            }}>
                <div className="container">
                    <div className="slide-up">
                        <span style={{ fontSize: '4rem', display: 'block', marginBottom: 'var(--space-lg)' }}>
                            📸✨
                        </span>
                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                            marginBottom: 'var(--space-lg)',
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Capturá cada momento.<br />Compartilo al instante.
                        </h1>
                        <p style={{
                            fontSize: '1.25rem',
                            color: 'var(--color-text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto var(--space-2xl)',
                            lineHeight: 1.8
                        }}>
                            La plataforma definitiva para compartir fotos en casamientos, 15 años, cumpleaños y celebraciones.
                            Tus invitados escanean un código QR, suben fotos y las ven aparecer en vivo en la pantalla grande.
                        </p>
                        <div className="flex flex-center gap-lg" style={{ flexWrap: 'wrap' }}>
                            <Link href={ctaHref} className="btn btn-primary btn-lg">
                                {isAuthenticated ? 'Ir al Panel' : 'Empezar'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section - Quick View */}
            <section style={{
                padding: '0 0 var(--space-3xl)',
                marginTop: '-var(--space-2xl)', // Overlap slightly or just pull up
                position: 'relative',
                zIndex: 10
            }}>
                <div className="container">
                    <div className="card fade-in" style={{
                        maxWidth: '500px',
                        margin: '0 auto',
                        textAlign: 'center',
                        background: 'rgba(20, 20, 25, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'var(--gradient-primary)',
                            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
                        }}></div>

                        <h3 className="mb-md" style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>
                            Pase único por evento
                        </h3>
                        <div style={{
                            fontSize: '3.5rem',
                            fontWeight: '800',
                            lineHeight: 1,
                            marginBottom: 'var(--space-md)',
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            $4.999
                        </div>
                        <p className="text-muted mb-lg" style={{ fontSize: '0.9rem' }}>
                            Sin suscripciones. Sin costos ocultos.
                        </p>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 'var(--space-md)',
                            flexWrap: 'wrap',
                            fontSize: '0.9rem',
                            color: 'var(--color-text-secondary)'
                        }}>
                            <span>✅ Fotos Ilimitadas</span>
                            <span>✅ Invitados Ilimitados</span>
                            <span>✅ Descarga Incluida</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: 'var(--space-3xl) 0' }}>
                <div className="container">
                    <h2 className="text-center mb-xl" style={{ fontSize: '2rem' }}>
                        ¿Por qué elegir SnapLive?
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'var(--space-xl)'
                    }}>
                        {/* Feature 1 */}
                        <div className="card fade-in" style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '3rem' }}>📱</span>
                            <h3 className="mt-lg mb-md">Escaneá y Subí</h3>
                            <p className="text-muted">
                                Los invitados simplemente escanean el código QR con su celular.
                                No necesitan descargar ninguna app.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card fade-in" style={{ textAlign: 'center', animationDelay: '100ms' }}>
                            <span style={{ fontSize: '3rem' }}>⚡</span>
                            <h3 className="mt-lg mb-md">Galería en Tiempo Real</h3>
                            <p className="text-muted">
                                Las fotos aparecen instantáneamente en la pantalla.
                                Actualizaciones en vivo con WebSocket.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card fade-in" style={{ textAlign: 'center', animationDelay: '200ms' }}>
                            <span style={{ fontSize: '3rem' }}>📺</span>
                            <h3 className="mt-lg mb-md">Modo Pantalla</h3>
                            <p className="text-muted">
                                Galería a pantalla completa pensada para
                                pantallas grandes y proyectores.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="card fade-in" style={{ textAlign: 'center', animationDelay: '300ms' }}>
                            <span style={{ fontSize: '3rem' }}>☁️</span>
                            <h3 className="mt-lg mb-md">60 Días para Descargar</h3>
                            <p className="text-muted">
                                Todas las fotos guardadas de forma segura en la nube
                                durante 60 días después del evento. ¡Descargalas a tiempo!
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="card fade-in" style={{ textAlign: 'center', animationDelay: '400ms' }}>
                            <span style={{ fontSize: '3rem' }}>🔒</span>
                            <h3 className="mt-lg mb-md">Eventos Privados</h3>
                            <p className="text-muted">
                                URLs únicas aseguran que solo tus invitados
                                puedan acceder al evento.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="card fade-in" style={{ textAlign: 'center', animationDelay: '500ms' }}>
                            <span style={{ fontSize: '3rem' }}>🎉</span>
                            <h3 className="mt-lg mb-md">Para Cualquier Evento</h3>
                            <p className="text-muted">
                                Casamientos, 15 años, cumpleaños,
                                eventos corporativos ¡y más!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{
                padding: 'var(--space-3xl) 0',
                background: 'var(--color-bg-secondary)'
            }}>
                <div className="container">
                    <h2 className="text-center mb-xl" style={{ fontSize: '2rem' }}>
                        ¿Cómo Funciona?
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 'var(--space-xl)',
                        maxWidth: '900px',
                        margin: '0 auto'
                    }}>
                        <div className="text-center">
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                margin: '0 auto var(--space-lg)'
                            }}>1</div>
                            <h4 className="mb-sm">Creá tu Evento</h4>
                            <p className="text-muted">Registrate y creá tu evento en segundos</p>
                        </div>

                        <div className="text-center">
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                margin: '0 auto var(--space-lg)'
                            }}>2</div>
                            <h4 className="mb-sm">Compartí el QR</h4>
                            <p className="text-muted">Imprimí el código QR y mostralo en tu evento</p>
                        </div>

                        <div className="text-center">
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                margin: '0 auto var(--space-lg)'
                            }}>3</div>
                            <h4 className="mb-sm">¡Mirá la Magia!</h4>
                            <p className="text-muted">¡Las fotos aparecen en vivo en la pantalla grande!</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: 'var(--space-3xl) 0',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 className="mb-lg">¿Listo para hacer tu evento inolvidable?</h2>
                    <p className="text-muted mb-xl" style={{ maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
                        Unite a miles de organizadores de eventos que confían en SnapLive.
                    </p>
                    <Link href={ctaHref} className="btn btn-primary btn-lg">
                        {isAuthenticated ? 'Ir al Panel →' : 'Comenzar Ahora →'}
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: 'var(--space-xl) 0',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center'
            }}>
                <div className="container">
                    <p className="text-muted">
                        © 2026 SnapLive. Hecho con ❤️ para eventos increíbles.
                    </p>
                </div>
            </footer>
        </div>
    );
}
