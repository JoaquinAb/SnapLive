'use client';

/**
 * Componente EventCard
 * Muestra información del evento en el dashboard
 */
export default function EventCard({ event }) {
    const eventTypeEmojis = {
        wedding: '💒',
        quinceañera: '🎀',
        birthday: '🎂',
        corporate: '🏢',
        party: '🎉',
        other: '📅'
    };

    const eventTypeNames = {
        wedding: 'Casamiento',
        quinceañera: '15 Años',
        birthday: 'Cumpleaños',
        corporate: 'Corporativo',
        party: 'Fiesta',
        other: 'Otro'
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="card" style={{
            background: 'var(--gradient-card)',
            borderColor: event.isActive ? 'var(--color-success)' : 'var(--border-color)'
        }}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <span style={{ fontSize: '2rem' }}>
                        {eventTypeEmojis[event.type] || '📅'}
                    </span>
                    <h2 className="mt-lg mb-sm">{event.name}</h2>
                    <p className="text-muted">{formatDate(event.eventDate)}</p>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        {eventTypeNames[event.type] || 'Evento'}
                    </p>
                </div>
                <span className={`badge ${event.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {event.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            <div className="mt-xl" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-md)',
                textAlign: 'center'
            }}>
                <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {event.photos?.length || 0}
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Fotos</p>
                </div>
                <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {event.isPaid ? '✓' : '✕'}
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Pagado</p>
                </div>
                <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>∞</p>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Subidas</p>
                </div>
            </div>
        </div>
    );
}
