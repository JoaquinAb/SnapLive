'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import QRDownload from '../../components/QRDownload';
import PhotoGallery from '../../components/PhotoGallery';

/**
 * Página del Panel de Control
 * Panel principal del cliente con soporte para múltiples eventos
 * Cada evento requiere un pago separado
 */
export default function DashboardPage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Redirigir si no está autenticado
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Verificar si viene de un pago exitoso
    useEffect(() => {
        const paymentParam = searchParams.get('payment');
        if (paymentParam === 'success') {
            setSuccessMessage('¡Pago completado exitosamente! Ya podés crear tu evento.');
            router.replace('/dashboard');
        }
    }, [searchParams, router]);

    // Obtener eventos y estado de pago
    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;

            try {
                const eventsData = await api.getMyEvents();
                setEvents(eventsData.events || []);

                // Si tiene eventos, expandir el primero
                if (eventsData.events?.length > 0) {
                    setExpandedEvent(eventsData.events[0].id);
                }

                // Verificar estado de pago (si hay un pago pendiente sin usar)
                try {
                    const status = await api.getPaymentStatus();
                    setPaymentStatus(status);
                } catch (e) {
                    // En caso de error, asumir que no puede crear evento para obligar a verificar/pagar
                    // O podría ser un error de red, pero mejor fallar seguro
                    console.error('Error fetching payment status:', e);
                    setPaymentStatus({ canCreateEvent: false, demoMode: true });
                }
            } catch (err) {
                console.error('Error al obtener eventos:', err);
                try {
                    const status = await api.getPaymentStatus();
                    setPaymentStatus(status);
                } catch (e) {
                    console.error('Error fetching payment status (retry):', e);
                    setPaymentStatus({ canCreateEvent: false, demoMode: true });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    // Handler para crear nuevo evento
    const handleCreateNewEvent = () => {
        console.log('handleCreateNewEvent - paymentStatus:', paymentStatus);
        console.log('handleCreateNewEvent - events:', events.length);

        // Si puede crear evento (tiene pago disponible sin usar), ir directo
        if (paymentStatus?.canCreateEvent) {
            router.push('/dashboard/events/new');
        } else {
            // Si no tiene pago disponible, mostrar modal de pago
            setShowPaymentModal(true);
        }
    };

    // Manejar pago
    const handlePayment = async (provider) => {
        setLoading(true);
        setError(null);
        try {
            let result;
            if (provider === 'stripe') {
                result = await api.createStripeSession();
            } else {
                result = await api.createMercadoPagoPreference();
            }

            if (result.demo) {
                setSuccessMessage('¡Pago simulado exitoso! (Modo Demo)');
                setPaymentStatus({ canCreateEvent: true, demoMode: true });
                setShowPaymentModal(false);
                setLoading(false);
                // Redirigir a crear evento
                router.push('/dashboard/events/new');
            } else {
                window.location.href = result.url || result.initPoint || result.sandboxInitPoint;
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Eliminar foto
    const handleDeletePhoto = async (eventId, photoId) => {
        try {
            await api.deletePhoto(photoId);
            setEvents(prev => prev.map(event => {
                if (event.id === eventId) {
                    return {
                        ...event,
                        photos: event.photos.filter(p => p.id !== photoId)
                    };
                }
                return event;
            }));
        } catch (err) {
            setError(err.message);
        }
    };

    // Eliminar evento
    const handleDeleteEvent = async (eventId) => {
        if (!confirm('¿Estás seguro de eliminar este evento? Se perderán todas las fotos.')) {
            return;
        }
        try {
            await api.deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            setSuccessMessage('Evento eliminado exitosamente');
        } catch (err) {
            setError(err.message);
        }
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Obtener tipo de evento en español
    const getEventType = (type) => {
        const types = {
            'wedding': '💒 Casamiento',
            'quinceañera': '🎀 Quinceañera',
            'birthday': '🎂 Cumpleaños',
            'corporate': '💼 Corporativo',
            'party': '🎉 Fiesta',
            'other': '📸 Otro'
        };
        return types[type] || '📸 Evento';
    };

    if (authLoading || loading) {
        return (
            <div className="flex-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-page" style={{ padding: 'var(--space-xl) 0' }}>
            <div className="container">
                {/* Encabezado */}
                <div className="mb-xl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div>
                        <h1>¡Hola, {user?.name}! 👋</h1>
                        <p className="text-muted">Administrá tus eventos desde acá</p>
                    </div>

                    {/* Botón crear nuevo evento - siempre visible */}
                    <button onClick={handleCreateNewEvent} className="btn btn-primary">
                        ➕ Crear Nuevo Evento
                    </button>
                </div>

                {successMessage && (
                    <div className="alert alert-success mb-xl">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="alert alert-error mb-xl">
                        {error}
                    </div>
                )}

                {/* Modal de Pago */}
                {showPaymentModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: 'var(--space-lg)'
                    }} onClick={() => setShowPaymentModal(false)}>
                        <div className="card" style={{ maxWidth: '450px', width: '100%' }} onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <span style={{ fontSize: '3rem' }}>💳</span>
                                <h2 className="mt-lg mb-md">Pago Requerido</h2>
                                <p className="text-muted mb-xl">
                                    Cada evento requiere un pago único. Sin suscripciones, sin cargos mensuales.
                                </p>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-md)'
                                }}>
                                    <button onClick={() => handlePayment('stripe')} className="btn btn-primary btn-lg">
                                        💳 Pagar con Tarjeta (Stripe)
                                    </button>
                                    <button onClick={() => handlePayment('mercadopago')} className="btn btn-secondary btn-lg">
                                        🇦🇷 Pagar con MercadoPago
                                    </button>
                                    <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">
                                        Cancelar
                                    </button>
                                </div>

                                <p className="text-muted mt-xl" style={{ fontSize: '0.875rem' }}>
                                    Pago único por evento • Checkout seguro • Acceso inmediato
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de Eventos */}
                {events.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                        {events.map((event) => (
                            <div key={event.id} className="card">
                                {/* Header del evento (siempre visible) */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        padding: 'var(--space-md) 0'
                                    }}
                                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                >
                                    <div>
                                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            {event.name}
                                            {event.isActive && (
                                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                                    Activo
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-muted">
                                            {getEventType(event.type)} • {formatDate(event.eventDate)} • {event.photos?.length || 0} fotos
                                        </p>
                                    </div>
                                    <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s', transform: expandedEvent === event.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        ▼
                                    </span>
                                </div>

                                {/* Contenido expandible */}
                                {expandedEvent === event.id && (
                                    <div style={{
                                        marginTop: 'var(--space-lg)',
                                        paddingTop: 'var(--space-lg)',
                                        borderTop: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {/* QR y Acciones Rápidas */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                            gap: 'var(--space-lg)',
                                            marginBottom: 'var(--space-xl)'
                                        }}>
                                            <QRDownload eventSlug={event.slug} qrCodeUrl={event.qrCodeUrl} />

                                            <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <h3 className="mb-lg">⚡ Acciones Rápidas</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                                    <Link
                                                        href={`/event/${event.slug}`}
                                                        className="btn btn-secondary"
                                                        target="_blank"
                                                    >
                                                        👁️ Ver Página de Invitados
                                                    </Link>
                                                    <Link
                                                        href={`/event/${event.slug}/screen`}
                                                        className="btn btn-primary"
                                                        target="_blank"
                                                    >
                                                        📺 Abrir Modo Pantalla
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="btn btn-secondary"
                                                        style={{ color: 'var(--color-error)' }}
                                                    >
                                                        🗑️ Eliminar Evento
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Galería de Fotos */}
                                        <div>
                                            <h3 className="mb-lg">📷 Fotos del Evento ({event.photos?.length || 0})</h3>
                                            <PhotoGallery
                                                photos={event.photos || []}
                                                canDelete={true}
                                                onDeletePhoto={(photoId) => handleDeletePhoto(event.id, photoId)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : paymentStatus?.canCreateEvent ? (
                    /* No tiene eventos pero puede crear (tiene pago o modo demo) */
                    <div className="card text-center">
                        <span style={{ fontSize: '4rem' }}>🎉</span>
                        <h2 className="mt-lg mb-md">
                            {paymentStatus?.demoMode ? '¡Modo Demo Activo!' : '¡Listo para Empezar!'}
                        </h2>
                        <p className="text-muted mb-xl">
                            Creá tu primer evento y empezá a recibir fotos de tus invitados.
                        </p>
                        <Link href="/dashboard/events/new" className="btn btn-primary btn-lg">
                            Crear Mi Primer Evento →
                        </Link>
                    </div>
                ) : (
                    /* Necesita Pago para primer evento */
                    <div className="card text-center">
                        <span style={{ fontSize: '4rem' }}>💳</span>
                        <h2 className="mt-lg mb-md">Activá tu Primer Evento</h2>
                        <p className="text-muted mb-xl" style={{ maxWidth: '400px', margin: '0 auto var(--space-xl)' }}>
                            Pagá una sola vez por evento y obtené subidas ilimitadas de fotos.
                            Sin suscripciones, sin cargos ocultos.
                        </p>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-md)',
                            maxWidth: '300px',
                            margin: '0 auto'
                        }}>
                            <button onClick={() => handlePayment('stripe')} className="btn btn-primary btn-lg">
                                💳 Pagar con Tarjeta (Stripe)
                            </button>
                            <button onClick={() => handlePayment('mercadopago')} className="btn btn-secondary btn-lg">
                                🇦🇷 Pagar con MercadoPago
                            </button>
                        </div>

                        <p className="text-muted mt-xl" style={{ fontSize: '0.875rem' }}>
                            Pago único por evento • Checkout seguro • Acceso inmediato
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
