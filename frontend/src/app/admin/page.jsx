'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsData, usersData] = await Promise.all([
                api.getAdminStats(),
                api.getAdminUsers()
            ]);
            setStats(statsData);
            setUsers(usersData.users);
        } catch (err) {
            console.error('Admin fetch error:', err);
            setError('Error al cargar datos del panel');
        } finally {
            setLoading(false);
        }
    };



    if (authLoading || (loading && !stats && user?.role === 'admin')) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
                <h1>⛔ Acceso Denegado</h1>
                <p>No tienes permisos de administrador.</p>
                <p className="text-muted small">Tu rol actual es: {user?.role || 'invitado'}</p>
                <button onClick={() => router.push('/dashboard')} className="btn btn-primary mt-lg">
                    Volver al Dashboard
                </button>
            </div>
        );
    }





    if (!user || user.role !== 'admin') return null;

    return (
        <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
            <div className="admin-header mb-xl">
                <h1>🛡️ Panel de Administración</h1>
                <p className="text-muted">Gestión de usuarios y estadísticas del sistema</p>
            </div>

            {error && (
                <div className="alert alert-error mb-lg">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid mb-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
                    <div className="card text-center">
                        <span style={{ fontSize: '2rem' }}>👥</span>
                        <h3>{stats.users}</h3>
                        <p className="text-muted">Usuarios Registrados</p>
                    </div>
                    <div className="card text-center">
                        <span style={{ fontSize: '2rem' }}>📅</span>
                        <h3>{stats.events}</h3>
                        <p className="text-muted">Eventos Totales</p>
                    </div>
                    <div className="card text-center">
                        <span style={{ fontSize: '2rem' }}>🟢</span>
                        <h3>{stats.activeEvents}</h3>
                        <p className="text-muted">Eventos Activos</p>
                    </div>
                    <div className="card text-center">
                        <span style={{ fontSize: '2rem' }}>📸</span>
                        <h3>{stats.photos}</h3>
                        <p className="text-muted">Fotos Subidas</p>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="card">
                <div className="flex-between mb-lg">
                    <h3>Usuarios ({users.length})</h3>
                    <button onClick={fetchData} className="btn btn-secondary btn-sm">
                        🔄 Actualizar
                    </button>
                </div>

                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: 'var(--space-sm)' }}>Nombre</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Email</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Rol</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Eventos</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Registrado el</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: 'var(--space-sm)' }}>{u.name}</td>
                                    <td style={{ padding: 'var(--space-sm)' }}>{u.email}</td>
                                    <td style={{ padding: 'var(--space-sm)' }}>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: 'var(--space-sm)' }}>{u.eventsCount}</td>
                                    <td style={{ padding: 'var(--space-sm)' }}>
                                        {new Date(u.joinedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .table-responsive {
                    overflow-x: auto;
                }
                th {
                    color: var(--color-text-secondary);
                    font-weight: 500;
                    font-size: 0.9rem;
                }
                td {
                    color: var(--color-text-primary);
                }
                tr:last-child {
                    border-bottom: none;
                }
            `}</style>
        </div>
    );
}
