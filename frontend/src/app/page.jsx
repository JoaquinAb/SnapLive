'use client';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRef, useEffect } from 'react';

/**
 * Landing Page
 * Página de inicio moderna y visualmente atractiva con:
 * - Hero Section con Gradient Mesh interactivo (mouse tracking via CSS vars + canvas partículas)
 * - Sección de Video Demostrativo (autoplay, muted, loop)
 * - Scroll Reveal con Intersection Observer en tarjetas de features
 * Redirige a /dashboard si el usuario ya está autenticado
 */
export default function HomePage() {
    const { isAuthenticated, loading } = useAuth();
    const ctaHref = isAuthenticated ? '/dashboard' : '/register';

    // ─── 1. Hero – Mouse tracking con CSS custom properties ──────────────────
    // Escuchamos en window para capturar el mouse aunque el puntero
    // esté levemente fuera de los límites del hero.
    const heroRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const mouse = useRef({ x: 0.5, y: 0.5 });   // objetivo normalizado [0-1]
    const smooth = useRef({ x: 0.5, y: 0.5 });   // posición suavizada
    const particles = useRef([]);

    useEffect(() => {
        const hero = heroRef.current;
        const canvas = canvasRef.current;
        if (!hero || !canvas) return;

        const ctx = canvas.getContext('2d');

        /* ── Tamaño del canvas ── */
        const resize = () => {
            canvas.width = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        };
        resize();
        const resizeObs = new ResizeObserver(resize);
        resizeObs.observe(hero);

        /* ── Configuración de partículas ── */
        const PARTICLE_COUNT = 130;
        const CURSOR_ATTRACT = 180;   // px — radio de atracción del cursor
        const ATTRACT_FORCE = 0.065; // fuerza de atracción (más reactivo al mouse)

        const makeParticle = () => {
            const hues = [265, 280, 190, 200, 320]; // violeta, cian, rosa
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 2.0 + 0.6,    // radio entre 0.6 y 2.6px
                alpha: Math.random() * 0.6 + 0.2,    // opacidad 0.2–0.8
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                hue: hues[Math.floor(Math.random() * hues.length)],
                pulse: Math.random() * Math.PI * 2,  // fase del pulso de brillo
            };
        };

        particles.current = Array.from({ length: PARTICLE_COUNT }, makeParticle);

        /* ── Mouse tracking en window ── */
        const onMouseMove = (e) => {
            const rect = hero.getBoundingClientRect();
            mouse.current.x = (e.clientX - rect.left) / rect.width;
            mouse.current.y = (e.clientY - rect.top) / rect.height;
        };
        window.addEventListener('mousemove', onMouseMove);

        /* ── Loop principal ── */
        const lerp = (a, b, t) => a + (b - a) * t;
        let frame = 0;

        const tick = () => {
            frame++;
            smooth.current.x = lerp(smooth.current.x, mouse.current.x, 0.06);
            smooth.current.y = lerp(smooth.current.y, mouse.current.y, 0.06);

            const W = canvas.width;
            const H = canvas.height;
            const mx = smooth.current.x * W;
            const my = smooth.current.y * H;

            ctx.clearRect(0, 0, W, H);

            /* ── Actualizar posición de cada partícula ── */
            particles.current.forEach((p) => {
                p.pulse += 0.018;

                const dx = mx - p.x;
                const dy = my - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                /* Atracción gravitatoria hacia el cursor */
                if (dist < CURSOR_ATTRACT && dist > 1) {
                    const force = (CURSOR_ATTRACT - dist) / CURSOR_ATTRACT;
                    p.vx += (dx / dist) * force * ATTRACT_FORCE;
                    p.vy += (dy / dist) * force * ATTRACT_FORCE;
                }

                /* Fricción + movimiento (0.93 = más vivo, más rápido) */
                p.vx *= 0.91;
                p.vy *= 0.91;
                p.x += p.vx;
                p.y += p.vy;

                /* Wrap-around suave en bordes */
                if (p.x < -10) p.x = W + 10;
                if (p.x > W + 10) p.x = -10;
                if (p.y < -10) p.y = H + 10;
                if (p.y > H + 10) p.y = -10;
            });


            /* ── Dibujar partículas ── */
            particles.current.forEach((p) => {
                /* Brillo pulsante sutil */
                const pulsedAlpha = p.alpha * (0.75 + 0.25 * Math.sin(p.pulse));
                const pulsedR = p.r * (0.9 + 0.15 * Math.sin(p.pulse * 0.7));

                /* Glow suave alrededor de la partícula */
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulsedR * 3.5);
                glow.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${pulsedAlpha})`);
                glow.addColorStop(0.5, `hsla(${p.hue}, 70%, 60%, ${pulsedAlpha * 0.4})`);
                glow.addColorStop(1, `hsla(${p.hue}, 70%, 60%, 0)`);

                ctx.beginPath();
                ctx.arc(p.x, p.y, pulsedR * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                /* Núcleo brillante de la partícula */
                ctx.beginPath();
                ctx.arc(p.x, p.y, pulsedR, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 90%, 90%, ${Math.min(pulsedAlpha * 1.4, 1)})`;
                ctx.fill();
            });

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            resizeObs.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);


    // ─── 2. Intersection Observer – Scroll Reveal global ────────────────────
    const featuresGridRef = useRef(null);

    useEffect(() => {
        // Observamos tanto las feature-cards como cualquier .reveal-item de la página
        const targets = document.querySelectorAll('.feature-card, .reveal-item');
        if (!targets.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('feature-card--visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
        );

        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);


    return (
        <div className="landing-page">

            {/* ══════════════════════════════════════════════
                HERO SECTION – Gradient Mesh Interactivo
            ══════════════════════════════════════════════ */}
            <section
                ref={heroRef}
                className="hero hero-interactive"
                style={{
                    minHeight: 'calc(100vh - 70px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 'var(--space-xl)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Canvas de partículas – único elemento de fondo */}
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />

                {/* Contenido del Hero */}
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
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
                            backgroundClip: 'text',
                            letterSpacing: '-0.02em',
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


            {/* ══════════════════════════════════════════════
                VIDEO DEMO SECTION
            ══════════════════════════════════════════════ */}
            <section className="video-demo-section reveal-item" style={{ '--card-delay': '0ms' }}>
                <div className="container">
                    <p className="video-demo-label">¿Cómo se ve en acción?</p>
                    <h2 className="video-demo-title">Mirá SnapLive en vivo</h2>

                    <div className="video-demo-wrapper">
                        {/* Glow decorativo detrás del video */}
                        <div className="video-demo-glow" aria-hidden="true" />

                        <div className="video-demo-container">
                            {/* Barra de "navegador" decorativa */}
                            <div className="video-demo-chrome">
                                <div className="video-demo-dots">
                                    <span style={{ background: '#ff5f57' }} />
                                    <span style={{ background: '#ffbd2e' }} />
                                    <span style={{ background: '#28c840' }} />
                                </div>
                                <div className="video-demo-url">snaplive.app/evento/mi-boda</div>
                            </div>

                            {/* Video placeholder – reemplazá el src con tu archivo real */}
                            <video
                                className="video-demo-player"
                                autoPlay
                                muted
                                loop
                                playsInline
                                poster="/video-poster.jpg"
                                aria-label="Video demostrativo de SnapLive"
                            >
                                {/* Reemplazá /demo.mp4 con la ruta de tu video real */}
                                <source src="/demo.mp4" type="video/mp4" />
                                Tu navegador no soporta la reproducción de video.
                            </video>

                            {/* Fallback visual cuando no hay video real */}
                            <div className="video-demo-fallback" aria-hidden="true">
                                <div className="video-demo-fallback-inner">
                                    <span style={{ fontSize: '3.5rem' }}>🎬</span>
                                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                                        Video demo próximamente
                                    </p>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        Reemplazá <code style={{ color: 'var(--color-primary-light)' }}>/demo.mp4</code> con tu video real
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                PRICING SECTION – Quick View
            ══════════════════════════════════════════════ */}
            <section style={{
                padding: 'var(--space-3xl) 0',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="container">
                    <div className="card reveal-item" style={{
                        maxWidth: '500px',
                        margin: '0 auto',
                        '--card-delay': '0ms',
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
                        }} />

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
                            $49.999
                        </div>

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

            {/* ══════════════════════════════════════════════
                FEATURES SECTION – Scroll Reveal (Intersection Observer)
            ══════════════════════════════════════════════ */}
            <section style={{ padding: 'var(--space-3xl) 0' }}>
                <div className="container">
                    <h2 className="text-center mb-xl reveal-item" style={{ fontSize: '2rem', '--card-delay': '0ms' }}>
                        ¿Por qué elegir SnapLive?
                    </h2>

                    <div
                        ref={featuresGridRef}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 'var(--space-xl)',
                        }}
                    >
                        {/* Las tarjetas usan la clase .feature-card para el Scroll Reveal */}
                        <div className="card feature-card" style={{ textAlign: 'center', '--card-delay': '0ms' }}>
                            <span style={{ fontSize: '3rem' }}>📱</span>
                            <h3 className="mt-lg mb-md">Escaneá y Subí</h3>
                            <p className="text-muted">
                                Los invitados simplemente escanean el código QR con su celular.
                                No necesitan descargar ninguna app.
                            </p>
                        </div>

                        <div className="card feature-card" style={{ textAlign: 'center', '--card-delay': '150ms' }}>
                            <span style={{ fontSize: '3rem' }}>⚡</span>
                            <h3 className="mt-lg mb-md">Galería en Tiempo Real</h3>
                            <p className="text-muted">
                                Las fotos aparecen instantáneamente en la pantalla.
                                Actualizaciones en vivo con WebSocket.
                            </p>
                        </div>

                        <div className="card feature-card" style={{ textAlign: 'center', '--card-delay': '300ms' }}>
                            <span style={{ fontSize: '3rem' }}>📺</span>
                            <h3 className="mt-lg mb-md">Modo Pantalla</h3>
                            <p className="text-muted">
                                Galería a pantalla completa pensada para
                                pantallas grandes y proyectores.
                            </p>
                        </div>

                        <div className="card feature-card" style={{ textAlign: 'center', '--card-delay': '450ms' }}>
                            <span style={{ fontSize: '3rem' }}>☁️</span>
                            <h3 className="mt-lg mb-md">60 Días para Descargar</h3>
                            <p className="text-muted">
                                Todas las fotos guardadas de forma segura en la nube
                                durante 60 días después del evento.
                            </p>
                        </div>

                        <div className="card feature-card" style={{ textAlign: 'center', '--card-delay': '600ms' }}>
                            <span style={{ fontSize: '3rem' }}>🔒</span>
                            <h3 className="mt-lg mb-md">Eventos Privados</h3>
                            <p className="text-muted">
                                URLs únicas aseguran que solo tus invitados
                                puedan acceder al evento.
                            </p>
                        </div>

                        <div className="card feature-card" style={{ textAlign: 'center', '--card-delay': '750ms' }}>
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

            {/* ══════════════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════════════ */}
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
                        {[
                            { num: '1', title: 'Creá tu Evento', desc: 'Registrate y creá tu evento en segundos', delay: '0ms' },
                            { num: '2', title: 'Compartí el QR', desc: 'Imprimí el código QR y mostralo en tu evento', delay: '150ms' },
                            { num: '3', title: '¡Mirá la Magia!', desc: '¡Las fotos aparecen en vivo en la pantalla grande!', delay: '300ms' },
                        ].map(({ num, title, desc, delay }) => (
                            <div key={num} className="text-center reveal-item" style={{ '--card-delay': delay }}>
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
                                }}>{num}</div>
                                <h4 className="mb-sm">{title}</h4>
                                <p className="text-muted">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="reveal-item" style={{ padding: 'var(--space-3xl) 0', textAlign: 'center', '--card-delay': '0ms' }}>
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
                <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                        <a
                            href="https://www.instagram.com/snaplive.com.ar/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#E1306C'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                            <span>Contáctanos en Instagram</span>
                        </a>
                    </div>
                    <p className="text-muted">
                        © 2026 SnapLive. Hecho con ❤️ para eventos increíbles.
                    </p>
                </div>
            </footer>
        </div>
    );
}
