import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export const metadata = {
    title: {
        default: 'SnapLive - Compartí fotos de tu evento en tiempo real',
        template: '%s | SnapLive',
    },
    description: 'La plataforma para compartir fotos en tiempo real en casamientos, cumpleaños de 15, fiestas y celebraciones. Tus invitados escanean un QR, suben fotos y aparecen en vivo en la pantalla.',
    keywords: ['fotos eventos', 'fotos casamiento', 'fotos fiesta', 'galería en vivo', 'compartir fotos', 'fotos en tiempo real', 'QR fotos', 'SnapLive', 'fotos cumpleaños de 15', 'álbum digital evento'],
    authors: [{ name: 'SnapLive' }],
    creator: 'SnapLive',
    metadataBase: new URL('https://snaplive.com.ar'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'SnapLive - Compartí fotos de tu evento en tiempo real',
        description: 'Tus invitados escanean un QR, suben fotos desde el celular y aparecen en vivo en la pantalla grande. Ideal para casamientos, 15 años y fiestas.',
        url: 'https://snaplive.com.ar',
        siteName: 'SnapLive',
        locale: 'es_AR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SnapLive - Compartí fotos de tu evento en tiempo real',
        description: 'Tus invitados escanean un QR, suben fotos desde el celular y aparecen en vivo en la pantalla grande.',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="es-AR">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <AuthProvider>
                    <Navbar />
                    <main>{children}</main>
                </AuthProvider>
            </body>
        </html>
    );
}
