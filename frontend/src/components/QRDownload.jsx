'use client';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

/**
 * Componente QRDownload
 * Muestra y descarga el código QR del evento
 */
export default function QRDownload({ eventSlug, qrCodeUrl }) {
    const [loading, setLoading] = useState(false);
    const [displayUrl, setDisplayUrl] = useState(qrCodeUrl);

    // Si no hay URL (falló carga a Cloudinary), generar on-the-fly
    useEffect(() => {
        if (!qrCodeUrl) {
            api.getQR(eventSlug, 'base64')
                .then(data => setDisplayUrl(data.qr))
                .catch(err => console.error('Error fetching QR:', err));
        }
    }, [eventSlug, qrCodeUrl]);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const data = await api.getQR(eventSlug, 'base64');

            const link = document.createElement('a');
            link.download = `qr-${eventSlug}.png`;
            link.href = data.qr;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error descargando QR:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ textAlign: 'center' }}>
            <h3 className="mb-lg">Código QR del Evento</h3>

            <div className="qr-container mb-lg">
                {displayUrl ? (
                    <img
                        src={displayUrl}
                        alt="Código QR del evento"
                        style={{ width: '200px', height: '200px' }}
                    />
                ) : (
                    <div style={{ width: '200px', height: '200px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <span className="text-muted">Cargando QR...</span>
                    </div>
                )}
            </div>

            <p className="text-muted mb-lg">
                Los invitados pueden escanear este código para subir fotos
            </p>

            <button
                onClick={handleDownload}
                className="btn btn-primary"
                disabled={loading}
            >
                {loading ? 'Descargando...' : '⬇️ Descargar QR'}
            </button>

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
