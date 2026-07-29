'use client';
import { useState, useEffect, useRef } from 'react';

/**
 * QRDownload – Código QR estilizado con badge "SnapLive" central
 *
 * Stack técnico:
 *  - librería `qrcode` (SSR-safe, puro JS) para generar el QR en <canvas>
 *  - Canvas 2D API para pintar el badge "SnapLive" encima
 *  - Nivel de corrección H (30 %) → tolera perfectamente el badge central
 *  - Descarga PNG directamente desde el canvas
 */
export default function QRDownload({ eventSlug, qrCodeUrl }) {
    const canvasRef            = useRef(null);
    const [qrReady, setQrReady] = useState(false);
    const [loading, setLoading] = useState(false);

    // URL que se codifica dentro del QR
    const eventUrl =
        qrCodeUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snaplive.app'}/event/${eventSlug}`;

    /* ── Generar QR en el canvas al montar ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const SIZE = 280;

        // Importación dinámica → nunca se ejecuta en SSR
        import('qrcode').then((mod) => {
            const QRCode = mod.default ?? mod;

            QRCode.toCanvas(canvas, eventUrl, {
                errorCorrectionLevel: 'H',   // nivel alto → 30 % de redundancia
                width:  SIZE,
                margin: 2,
                color: {
                    dark:  '#000000',   // negro → máximo contraste, ideal para imprimir
                    light: '#ffffff',   // blanco → fondo limpio para impresión
                },
            })
            .then(() => {
                // Una vez generado el QR, superponemos el badge central
                const ctx = canvas.getContext('2d');
                drawSnaplBadge(ctx, SIZE);
                setQrReady(true);
            })
            .catch((err) => console.error('Error generando QR:', err));
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventUrl]);

    /* ── Descarga del canvas como PNG ── */
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas || !qrReady) return;
        setLoading(true);
        try {
            const link       = document.createElement('a');
            link.download    = `qr-snaplive-${eventSlug}.png`;
            link.href        = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ textAlign: 'center' }}>
            <h3 className="mb-lg">Código QR del Evento</h3>

            {/* Contenedor con glow y borde degradado */}
            <div style={{
                display:         'inline-flex',
                alignItems:      'center',
                justifyContent:  'center',
                padding:         '16px',
                background:      'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.08) 100%)',
                borderRadius:    '20px',
                border:          '1px solid rgba(124,58,237,0.35)',
                boxShadow:       '0 0 40px rgba(124,58,237,0.25), 0 0 80px rgba(6,182,212,0.12)',
                marginBottom:    'var(--space-lg)',
                minWidth:        '312px',
                minHeight:       '312px',
                position:        'relative',
            }}>
                {/* Skeleton de carga */}
                {!qrReady && (
                    <div style={{
                        width:           '280px',
                        height:          '280px',
                        borderRadius:    '12px',
                        background:      'rgba(124,58,237,0.08)',
                        display:         'flex',
                        alignItems:      'center',
                        justifyContent:  'center',
                        color:           'var(--color-text-muted)',
                        fontSize:        '0.875rem',
                        position:        'absolute',
                    }}>
                        Generando QR...
                    </div>
                )}

                {/* Canvas del QR */}
                <canvas
                    ref={canvasRef}
                    style={{
                        borderRadius: '12px',
                        display:      qrReady ? 'block' : 'none',
                    }}
                />
            </div>

            <p className="text-muted mb-lg">
                Los invitados escanean este código para subir fotos
            </p>

            {/* Botón de descarga */}
            <button
                onClick={handleDownload}
                className="btn btn-primary"
                disabled={loading || !qrReady}
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
   Dibuja el badge "SnapLive" en el centro del canvas QR.
   Usa canvas 2D puro → sin dependencias extra.
───────────────────────────────────────────────────────────── */
function drawSnaplBadge(ctx, size) {
    const cx  = size / 2;
    const cy  = size / 2;
    const bw  = 122;   // ancho del badge
    const bh  = 38;    // alto del badge
    const r   = 10;    // radio de esquinas

    /* 1 — Fondo blanco (para impresión y legibilidad sobre QR blanco) */
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, cx - bw / 2, cy - bh / 2, bw, bh, r);
    ctx.fill();

    /* 2 — Borde con gradiente violeta→cian */
    const borderGrad = ctx.createLinearGradient(cx - bw / 2, cy, cx + bw / 2, cy);
    borderGrad.addColorStop(0, '#7c3aed');
    borderGrad.addColorStop(1, '#06b6d4');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth   = 2.5;
    roundRectPath(ctx, cx - bw / 2, cy - bh / 2, bw, bh, r);
    ctx.stroke();

    /* 3 — Texto "SnapLive" con gradiente */
    ctx.font         = 'bold 20px "Inter", system-ui, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const textGrad   = ctx.createLinearGradient(cx - bw / 2, cy, cx + bw / 2, cy);
    textGrad.addColorStop(0, '#a78bfa');   // violeta claro
    textGrad.addColorStop(1, '#22d3ee');   // cian claro
    ctx.fillStyle = textGrad;
    ctx.fillText('SnapLive', cx, cy);
}

/* Helper: dibuja un path de rectángulo con esquinas redondeadas */
function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x,     y,     x + r, y);
    ctx.closePath();
}
