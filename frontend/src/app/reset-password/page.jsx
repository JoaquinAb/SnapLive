'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

/**
 * Página para Restablecer Contraseña
 */
// Componente interno con la lógica que usa useSearchParams
function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Link de recuperación inválido. Por favor solicitá uno nuevo.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await api.resetPassword(token, password);
            setSuccess(true);

            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" style={{
            minHeight: 'calc(100vh - 70px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-xl)'
        }}>
            <div className="card slide-up" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="text-center mb-xl">
                    <span style={{ fontSize: '3rem' }}>🔑</span>
                    <h1 className="mt-lg">Nueva Contraseña</h1>
                    <p className="text-muted">Ingresá tu nueva contraseña</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center">
                        <div className="alert alert-success mb-lg">
                            ✅ ¡Contraseña actualizada exitosamente!
                        </div>
                        <p className="text-muted mb-lg">
                            Serás redirigido al login en unos segundos...
                        </p>
                        <Link href="/login" className="btn btn-primary">
                            Ir al Login
                        </Link>
                    </div>
                ) : token ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nueva Contraseña</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmar Contraseña</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <Link href="/forgot-password" className="btn btn-primary">
                            Solicitar Nuevo Link
                        </Link>
                    </div>
                )}

                <p className="text-center mt-xl text-muted">
                    <Link href="/login">← Volver al Login</Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex-center" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
