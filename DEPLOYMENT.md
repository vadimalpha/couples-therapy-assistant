# Deployment Guide

This guide covers deploying the Couples Therapy Assistant to production.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│     Railway      │────▶│  SurrealDB      │
│   (Frontend)    │     │    (Backend)     │     │    Cloud        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                        ┌──────┴──────┐
                        │             │
                   ┌────▼────┐   ┌────▼────┐
                   │  Redis  │   │ OpenAI  │
                   │(Railway)│   │   API   │
                   └─────────┘   └─────────┘
```

## Prerequisites

- GitHub account (for deployment)
- Vercel account (free tier works)
- Railway account (~$5-20/month)
- SurrealDB Cloud account (already set up)
- Firebase project (already set up)
- OpenAI API key
- SendGrid account (free tier: 100 emails/day)

---

## Step 1: Railway Setup (Backend)

### 1.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your account

### 1.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account if not already
4. Select your repository: `epic-couples-therapy-assistant`

### 1.3 Configure Backend Service

1. After import, click on the service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm run start`

### 1.4 Add Redis

1. Click **"+ New"** in your project
2. Select **"Database"** → **"Add Redis"**
3. Railway automatically sets `REDIS_URL` for your backend

### 1.5 Configure Environment Variables

Go to backend service → **Variables** tab and add:

```env
NODE_ENV=production
PORT=3001

# Frontend (update after Vercel deploy)
FRONTEND_URL=https://your-app.vercel.app

# Firebase Admin SDK
FIREBASE_PROJECT_ID=weiu-fbfe2
FIREBASE_PRIVATE_KEY=<paste your private key>
FIREBASE_CLIENT_EMAIL=<paste your client email>

# SurrealDB Cloud
SURREALDB_URL=wss://your-instance.surreal.cloud
SURREALDB_USER=admin
SURREALDB_PASS=<your password>
SURREALDB_NS=couples_therapy
SURREALDB_DB=main

# OpenAI
OPENAI_API_KEY=<your key>

# SendGrid
SENDGRID_API_KEY=<your key>
SENDGRID_FROM_EMAIL=<your verified email>
```

**Note**: `REDIS_URL` is automatically injected by Railway.

### 1.6 Generate Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://couples-therapy-backend-production.up.railway.app`)

---

## Step 2: Vercel Setup (Frontend)

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repos

### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Select your repository
3. Set **Root Directory**: `frontend`
4. Framework Preset: **Vite** (should auto-detect)

### 2.3 Configure Environment Variables

Add these in the Vercel dashboard:

```env
VITE_API_URL=https://your-backend.up.railway.app
VITE_WS_URL=wss://your-backend.up.railway.app
VITE_FIREBASE_API_KEY=<from Firebase console>
VITE_FIREBASE_AUTH_DOMAIN=weiu-fbfe2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=weiu-fbfe2
VITE_FIREBASE_STORAGE_BUCKET=weiu-fbfe2.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<from Firebase console>
VITE_FIREBASE_APP_ID=<from Firebase console>
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your Vercel URL

### 2.5 Update Backend CORS

Go back to Railway and update:
```env
FRONTEND_URL=https://your-app.vercel.app
```

---

## Step 3: Firebase Configuration

### 3.1 Add Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized Domains**
4. Add your Vercel domain: `your-app.vercel.app`

### 3.2 Update OAuth Redirect

If using Google Sign-In:
1. Go to **Authentication** → **Sign-in method** → **Google**
2. Add your production domain to authorized redirect URIs

---

## Step 4: Verify Deployment

### 4.1 Health Check

```bash
curl https://your-backend.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "dbConnected": true,
  "version": "1.0.0"
}
```

### 4.2 Test Frontend

1. Open your Vercel URL
2. Try logging in
3. Create a test conflict
4. Verify AI responses work

---

## Environment Variables Summary

### Backend (Railway)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `PORT` | Railway sets this automatically |
| `FRONTEND_URL` | Your Vercel URL |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `SURREALDB_URL` | SurrealDB Cloud WebSocket URL |
| `SURREALDB_USER` | Database username |
| `SURREALDB_PASS` | Database password |
| `SURREALDB_NS` | Namespace (`couples_therapy`) |
| `SURREALDB_DB` | Database (`main`) |
| `OPENAI_API_KEY` | OpenAI API key |
| `REDIS_URL` | Auto-injected by Railway |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend Railway URL (https) |
| `VITE_WS_URL` | Backend Railway URL (wss) |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |

---

## Troubleshooting

### Backend won't start

1. Check Railway logs for errors
2. Verify all environment variables are set
3. Check Redis connection

### CORS errors

1. Verify `FRONTEND_URL` is set correctly in Railway
2. Include `https://` prefix
3. Redeploy backend after changing

### WebSocket connection fails

1. Use `wss://` (not `ws://`) for production
2. Railway supports WebSockets by default
3. Check browser console for specific errors

### Database connection fails

1. Verify SurrealDB Cloud credentials
2. Check if instance is running (SurrealDB Cloud dashboard)
3. Verify namespace and database names match

---

## Costs Estimate

| Service | Cost |
|---------|------|
| Vercel (Frontend) | Free tier |
| Railway (Backend + Redis) | ~$5-20/month |
| SurrealDB Cloud | $25-100/month |
| OpenAI API | ~$1-5/conflict |
| SendGrid | Free (100 emails/day) |
| Firebase Auth | Free tier |

**Total**: ~$30-125/month + API usage

---

## Custom Domain (Optional)

### Vercel
1. Go to Project → Settings → Domains
2. Add your domain
3. Configure DNS as instructed

### Railway
1. Go to Service → Settings → Networking
2. Add custom domain
3. Configure DNS as instructed
