# SnapLive 📸

Real-time event photo sharing platform. Perfect for weddings, quinceañeras, birthdays, and any celebration!

## Features

- 🎉 **Event Creation** - Create events with unique QR codes
- 📱 **Guest Upload** - Guests scan QR and upload photos instantly
- ⚡ **Real-time Gallery** - Photos appear live using WebSockets
- 📺 **Screen Mode** - Full-screen display for large screens
- 💳 **Payments** - Stripe & MercadoPago integration
- ☁️ **Cloud Storage** - Images stored and optimized on Cloudinary

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Express.js |
| Database | PostgreSQL + Sequelize |
| Real-time | Socket.io |
| Auth | JWT |
| Storage | Cloudinary |
| Payments | Stripe, MercadoPago |

## Project Structure

```
web_SnapLive/
├── backend/
│   ├── src/
│   │   ├── config/       # Database, Cloudinary, Payment configs
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # QR, Image, WebSocket services
│   │   ├── middleware/   # Auth, Upload middleware
│   │   └── index.js      # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # API client
│   │   └── styles/       # CSS
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Cloudinary account
- Stripe and/or MercadoPago account

### 1. Clone & Install

```bash
cd web_SnapLive

# Install backend dependencies
cd backend
npm install
cp .env.example .env

# Install frontend dependencies
cd ../frontend
npm install
cp .env.example .env.local
```

### 2. Configure Environment

**Backend `.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/snaplive
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_SECRET_KEY=sk_test_...
MERCADOPAGO_ACCESS_TOKEN=your-token
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb snaplive

# The backend will auto-sync tables on first run
```

### 4. Run Development

```bash
# Terminal 1: Backend
cd backend
npm run dev    # http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev    # http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Events
- `POST /api/events` - Create event (requires payment)
- `GET /api/events/my-event` - Get user's event
- `GET /api/events/:slug` - Get event by slug (public)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Photos
- `POST /api/photos/:eventSlug` - Upload photos
- `GET /api/photos/:eventSlug` - Get event photos
- `DELETE /api/photos/:photoId` - Delete photo

### Payments
- `POST /api/payments/stripe/create-session` - Create Stripe checkout
- `POST /api/payments/mercadopago/create-preference` - Create MP preference
- `GET /api/payments/status` - Check payment status

## User Flow

1. **Organizer** registers and pays for event subscription
2. **Organizer** creates event → Gets unique QR code
3. **Organizer** displays QR at event
4. **Guests** scan QR → Upload photos from phone
5. **Photos** appear in real-time on the display

## Mobile / PWA

The frontend is mobile-optimized and can be converted to:
- **PWA** - Add manifest.json and service worker
- **React Native/Expo** - Reuse hooks and API client

## License

MIT
