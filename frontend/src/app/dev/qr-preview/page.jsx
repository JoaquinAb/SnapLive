'use client';
import QRDownload from '../../../components/QRDownload';

/**
 * Página temporal de preview del QR (solo dev)
 * Navegar a /dev/qr-preview para ver el componente QR
 */
export default function QRPreviewPage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0d16',
            padding: '2rem',
        }}>
            <QRDownload
                eventSlug="mi-boda-2025"
                qrCodeUrl={null}
            />
        </div>
    );
}
