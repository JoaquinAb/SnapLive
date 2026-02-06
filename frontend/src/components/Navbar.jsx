'use client';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

/**
 * Navbar Component
 * Navegación principal con estado de autenticación
 */
export default function Navbar() {
    const { user, logout, isAuthenticated, loading } = useAuth();

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link href="/" className="navbar-logo">
                    📸 <span>SnapLive</span>
                </Link>

                <ul className="navbar-nav">
                    {loading ? (
                        <li><span className="text-muted">...</span></li>
                    ) : isAuthenticated ? (
                        <>
                            <li>
                                <Link href="/dashboard">Panel</Link>
                            </li>
                            {user.role === 'admin' && (
                                <li>
                                    <Link href="/admin">Admin</Link>
                                </li>
                            )}
                            <li>
                                <button
                                    onClick={logout}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Salir
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link href="/login">Ingresar</Link>
                            </li>
                            <li>
                                <Link href="/register" className="btn btn-primary btn-sm">
                                    Empezar
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}
