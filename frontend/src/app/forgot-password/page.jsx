'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

/**
 * Página de Recuperación de Contraseña
 */
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [demoLink, setDemoLink] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await api.forgotPassword(email);
            setSuccess(true);

            // En modo demo, mostrar el link
            if (result.demo && result.resetLink) {
                setDemoLink(result.resetLink);
            }
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
                    <span style={{ fontSize: '3rem' }}>🔐</span>
                    <h1 className="mt-lg">Recuperar Contraseña</h1>
                    <p className="text-muted">Te enviaremos un link para restablecer tu contraseña</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center">
                        <div className="alert alert-success mb-lg">
                            ✅ Si el email existe, recibirás un link para restablecer tu contraseña.
                        </div>

                        {demoLink && (
                            <div style={{
                                background: 'rgba(168, 85, 247, 0.1)',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-lg)',
                                marginBottom: 'var(--space-lg)'
                            }}>
                                <p className="text-muted mb-md" style={{ fontSize: '0.875rem' }}>
                                    🧪 <strong>Modo Demo:</strong> Usá este link para restablecer tu contraseña
                                </p>
                                <Link
                                    href={demoLink.replace(process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000', '')}
                                    className="btn btn-primary btn-sm"
                                >
                                    Ir a Restablecer Contraseña
                                </Link>
                            </div>
                        )}

                        <Link href="/login" className="btn btn-secondary">
                            Volver al Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperación'}
                        </button>
                    </form>
                )}

                <p className="text-center mt-xl text-muted">
                    <Link href="/login">← Volver al Login</Link>
                </p>
            </div>
        </div>
    );
}
