'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';

export const dynamic = 'force-dynamic';

/**
 * Contenido del formulario de creación de evento
 */
function CreateEventContent() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [name, setName] = useState('');
    const [type, setType] = useState('wedding');
    const [eventDate, setEventDate] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get('payment');

    // Redirigir si no está autenticado
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.createEvent({ name, type, eventDate });
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: 'calc(100vh - 70px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-xl)'
        }}>
            <div className="card slide-up" style={{ width: '100%', maxWidth: '500px' }}>
                <div className="text-center mb-xl">
                    <span style={{ fontSize: '3rem' }}>🎉</span>
                    <h1 className="mt-lg">Crear tu Evento</h1>
                    <p className="text-muted">Completá los datos de tu evento</p>
                </div>

                {paymentStatus === 'success' && (
                    <div className="alert alert-success mb-lg">
                        <strong>¡Pago exitoso!</strong> Podés crear tu evento ahora.
                    </div>
                )}

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nombre del Evento</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Casamiento de María y Juan"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            minLength={3}
                            maxLength={100}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tipo de Evento</label>
                        <select
                            className="form-input form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            <option value="wedding">💒 Casamiento</option>
                            <option value="quinceañera">🎀 15 Años</option>
                            <option value="birthday">🎂 Cumpleaños</option>
                            <option value="corporate">🏢 Evento Corporativo</option>
                            <option value="party">🎉 Fiesta</option>
                            <option value="other">📅 Otro</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fecha del Evento</label>
                        <input
                            type="date"
                            className="form-input"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            required
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? 'Creando...' : 'Crear Evento 🚀'}
                    </button>
                </form>
            </div>
        </div>
    );
}

/**
 * Página principal con Suspense
 */
export default function CreateEventPage() {
    return (
        <Suspense fallback={
            <div className="flex-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
                <div className="spinner"></div>
            </div>
        }>
            <CreateEventContent />
        </Suspense>
    );
}
