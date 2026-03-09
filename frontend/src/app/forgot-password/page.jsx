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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.forgotPassword(email);
            setSuccess(true);
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
