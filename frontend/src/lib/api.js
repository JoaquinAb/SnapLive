/**
 * API Client
 * Centralized HTTP client for backend communication
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

/**
 * Get auth token from localStorage
 */
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function request(endpoint, options = {}) {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            ...options.headers,
        },
    };

    // Add auth token if available
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add content-type for JSON requests (unless it's FormData)
    if (!(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
    }

    let response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, config);
    } catch (error) {
        console.error('API Request Error:', error);
        throw new Error('No se pudo conectar con el servidor. Verificá tu conexión o intentá más tarde.');
    }

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            throw new Error('Ocurrió un error en el servidor. Por favor intentá más tarde.');
        }
        return response.text();
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error inesperado.');
    }

    return data;
}

// API methods
export const api = {
    // Auth
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    login: (data) => request('/auth/login', { method: 'POST', body: data }),
    getMe: () => request('/auth/me'),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password } }),

    // Events
    createEvent: (data) => request('/events', { method: 'POST', body: data }),
    getMyEvents: () => request('/events/my-events'),
    getMyEvent: () => request('/events/my-event'),
    getEvent: (slug) => request(`/events/${slug}`),
    updateEvent: (id, data) => request(`/events/${id}`, { method: 'PUT', body: data }),
    deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
    getQR: (slug, format) => request(`/events/${slug}/qr${format ? `?format=${format}` : ''}`),

    // Photos
    uploadPhotos: (eventSlug, formData) => request(`/photos/${eventSlug}`, {
        method: 'POST',
        body: formData
    }),
    getPhotos: (eventSlug, page = 1, limit = 50) =>
        request(`/photos/${eventSlug}?page=${page}&limit=${limit}`),
    deletePhoto: (photoId) => request(`/photos/${photoId}`, { method: 'DELETE' }),

    // Payments
    createStripeSession: () => request('/payments/stripe/create-session', { method: 'POST' }),
    createMercadoPagoPreference: () => request('/payments/mercadopago/create-preference', { method: 'POST' }),
    getPaymentStatus: () => request('/payments/status'),
    getPaymentHistory: () => request('/payments/history'),

    // Admin
    getAdminStats: () => request('/admin/stats'),
    getAdminUsers: () => request('/admin/users'),

    // Downloads
    downloadEventPhotos: (slug) => downloadFile(`/events/${slug}/download-all`),
};

/**
 * Make API request for file download
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Blob>} - File blob
 */
async function downloadFile(endpoint) {
    const token = getToken();
    const config = {
        headers: {}
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || 'Error al descargar el archivo');
            } catch (e) {
                throw new Error('Error al descargar el archivo');
            }
        }

        return await response.blob();
    } catch (error) {
        console.error('Download Request Error:', error);
        throw error;
    }
}


export default api;
