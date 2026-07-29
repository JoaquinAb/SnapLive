'use client';
import { useState, useEffect, useRef } from 'react';

/**
 * QRDownload – Código QR estilizado con logo "SnapLive"
 *
 * Usa qr-code-styling (client-side) para generar un QR con:
 *  - Nivel de corrección H (30 % de redundancia → tolera logo central)
 *  - Texto "SnapLive" superpuesto en el centro via canvas 2D
 *  - Colores neón/oscuro que combinan con el tema de SnapLive
 *  - Export PNG con nombre descriptivo
 *
 * El backend sigue siendo la fuente de verdad de la URL del evento;
 * aquí sólo generamos el QR visualmente en el cliente.
 */
export default function QRDownload({ eventSlug, qrCodeUrl }) {
    const containerRef  = useRef(null);   // div donde se monta el canvas del QR
    const qrRef         = useRef(null);   // instancia de QRCodeStyling
    const [ready, setReady]     = useState(false);
    const [loading, setLoading] = useState(false);

    // URL que codifica el QR (URL pública del evento)
    const eventUrl = qrCodeUrl
        || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snaplive.app'}/event/${eventSlug}`;

    /* ── Inicializar QRCodeStyling (sólo en el cliente) ── */
    useEffect(() => {
        if (!containerRef.current) return;

        // Importación dinámica para evitar errores SSR
        import('qr-code-styling').then(({ default: QRCodeStyling }) => {
            const size = 280; // px

            const qr = new QRCodeStyling({
                width:  size,
                height: size,
                type:   'canvas',
                data:   eventUrl,

                /* Nivel H = 30 % de corrección de errores.
                   Imprescindible cuando hay imagen/texto en el centro. */
                qrOptions: {
                    errorCorrectionLevel: 'H',
                },

                /* ── Estilo de los módulos (cuadraditos del QR) ── */
                dotsOptions: {
                    type:  'rounded',            // esquinas suaves
                    color: '#a78bfa',            // violeta claro (--color-primary-light)
                    gradient: {
                        type: 'linear',
                        rotation: 135,
                        colorStops: [
                            { offset: 0,   color: '#7c3aed' },  // violeta
                            { offset: 1,   color: '#06b6d4' },  // cian
                        ],
                    },
                },

                /* ── Fondo ── */
                backgroundOptions: {
                    color: '#0f0f17',            // casi negro, tono del tema
                },

                /* ── Esquinas externas ── */
                cornersSquareOptions: {
                    type:  'extra-rounded',
                    color: '#7c3aed',
                },

                /* ── Puntos internos de las esquinas ── */
                cornersDotOptions: {
                    type:  'dot',
                    color: '#06b6d4',
                },

                /* ── Logo central: texto "SnapLive" ──
                   qr-code-styling acepta una image (data URL).
                   Generamos el texto como un canvas pequeño y lo convertimos. */
                image:            buildLogoDataUrl(),
                imageOptions: {
                    crossOrigin:    'anonymous',
                    margin:         4,
                    imageSize:      0.30,        // ocupa 30 % del QR
                    hideBackgroundDots: true,    // quita los dots debajo del logo
                },
            });

            qr.append(containerRef.current);
            qrRef.current = qr;
            setReady(true);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventUrl]);

    /* ── Descarga PNG ── */
    const handleDownload = async () => {
        if (!qrRef.current) return;
        setLoading(true);
        try {
            await qrRef.current.download({
                name:      `qr-snaplive-${eventSlug}`,
                extension: 'png',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ textAlign: 'center' }}>
            <h3 className="mb-lg">Código QR del Evento</h3>

            {/* Contenedor del QR */}
            <div
                style={{
                    display:        'inline-flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    padding:        '16px',
                    background:     'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.10) 100%)',
                    borderRadius:   '20px',
                    border:         '1px solid rgba(124,58,237,0.3)',
                    boxShadow:      '0 0 40px rgba(124,58,237,0.2), 0 0 80px rgba(6,182,212,0.1)',
                    marginBottom:   'var(--space-lg)',
                    position:       'relative',
                }}
            >
                {/* Canvas generado por qr-code-styling */}
                <div
                    ref={containerRef}
                    style={{
                        borderRadius: '12px',
                        overflow:     'hidden',
                        lineHeight:   0,          // evita espacio extra bajo el canvas
                    }}
                />

                {/* Skeleton mientras carga */}
                {!ready && (
                    <div style={{
                        position:        'absolute',
                        inset:           '16px',
                        borderRadius:    '12px',
                        background:      'rgba(124,58,237,0.08)',
                        display:         'flex',
                        alignItems:      'center',
                        justifyContent:  'center',
                        color:           'var(--color-text-muted)',
                        fontSize:        '0.875rem',
                    }}>
                        Generando QR...
                    </div>
                )}
            </div>

            <p className="text-muted mb-lg">
                Los invitados escanean este código para subir fotos
            </p>

            {/* Botón de descarga */}
            <button
                onClick={handleDownload}
                className="btn btn-primary"
                disabled={loading || !ready}
            >
                {loading ? 'Descargando...' : '⬇️ Descargar QR'}
            </button>

            {/* URL del evento */}
            <div className="mt-lg">
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    URL del evento:
                    <a
                        href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/event/${eventSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 'var(--space-sm)' }}
                    >
                        {`/event/${eventSlug}`}
                    </a>
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Genera un data URL con el texto "SnapLive" estilizado
   para usarlo como logo central del QR.
   Tamaño pequeño (150×52 px) con fondo transparente.
───────────────────────────────────────────────────────────── */
function buildLogoDataUrl() {
    if (typeof window === 'undefined') return '';   // SSR guard

    const W = 200;
    const H = 70;
    const cvs = document.createElement('canvas');
    cvs.width  = W;
    cvs.height = H;
    const ctx  = cvs.getContext('2d');

    /* Fondo redondeado oscuro */
    const pad = 4;
    ctx.fillStyle = '#0f0f17';
    roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 14);
    ctx.fill();

    /* Borde con gradiente */
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, '#06b6d4');
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 3;
    roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 14);
    ctx.stroke();

    /* Texto "SnapLive" con gradiente */
    ctx.font         = 'bold 32px "Inter", system-ui, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const textGrad   = ctx.createLinearGradient(0, 0, W, 0);
    textGrad.addColorStop(0, '#a78bfa');
    textGrad.addColorStop(1, '#22d3ee');
    ctx.fillStyle    = textGrad;
    ctx.fillText('SnapLive', W / 2, H / 2);

    return cvs.toDataURL('image/png');
}

/* Utilitaria: dibuja un rectángulo con bordes redondeados */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
