# Couples Therapy Assistant - Backend

Express.js backend API with Firebase Admin authentication and SurrealDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase service account credentials
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/users/sync` - Sync Firebase user to SurrealDB (requires auth)
- `GET /api/users/me` - Get current user profile (requires auth)
- `PATCH /api/users/me` - Update user profile (requires auth)

### Relationships
- `POST /api/relationships/invite` - Send pairing invitation (requires auth)
- `GET /api/relationships/invitations` - Get pending invitations (requires auth)
- `POST /api/relationships/accept/:token` - Accept invitation (requires auth)
- `GET /api/relationships/me` - Get current relationship and partner info (requires auth)
- `DELETE /api/relationships/me` - Unpair from relationship (requires auth)

## Authentication

All protected endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
