import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export const metadata = {
    title: 'SnapLive - Compartí fotos de tu evento en tiempo real',
    description: 'Plataforma para compartir fotos en tiempo real en casamientos, cumpleaños de 15, fiestas y celebraciones.',
    keywords: 'fotos eventos, fotos casamiento, fotos fiesta, galería en vivo, compartir fotos',
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
