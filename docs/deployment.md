# Deployment Guide

This guide covers deploying the Couples Therapy Assistant to production environments.

## Architecture Overview

- **Frontend**: React + Vite app deployed to Vercel
- **Backend**: Node.js + Express API deployed to Railway
- **Database**: SurrealDB Cloud
- **Queue/Cache**: Redis Cloud or Upstash
- **Authentication**: Firebase Authentication
- **Real-time**: WebSocket server on Railway

## Prerequisites

1. **Accounts Required**:
   - [Vercel](https://vercel.com) account for frontend
   - [Railway](https://railway.app) account for backend
   - [SurrealDB Cloud](https://surrealdb.com/cloud) account
   - [Firebase](https://console.firebase.google.com) project
   - [Redis Cloud](https://redis.com/try-free) or [Upstash](https://upstash.com) account
   - [OpenAI](https://platform.openai.com) API key
   - (Optional) [Anthropic](https://console.anthropic.com) API key

2. **Tools Required**:
   - Git
   - Node.js 18+
   - Railway CLI (optional): `npm i -g @railway/cli`
   - Vercel CLI (optional): `npm i -g vercel`

## Backend Deployment (Railway)

### 1. Setup Railway Project

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Link to your repository
railway link
```

### 2. Configure Environment Variables

In Railway dashboard, add these environment variables:

```env
# Server
PORT=3001
NODE_ENV=production

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# SurrealDB Cloud
SURREALDB_URL=wss://your-instance.surreal.cloud
SURREALDB_USER=your-username
SURREALDB_PASS=your-password
SURREALDB_NS=couples_therapy
SURREALDB_DB=main

# OpenAI
OPENAI_API_KEY=sk-...

# Redis Cloud
REDIS_URL=rediss://default:password@host:port

# Anthropic (Optional)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Deploy Backend

The `railway.toml` configuration is already set up. Deploy with:

```bash
# Using Railway CLI
railway up

# Or push to GitHub and Railway will auto-deploy
git push origin main
```

### 4. Verify Backend Health

Once deployed, check the health endpoint:

```bash
curl https://your-backend.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "dbConnected": true,
  "version": "1.0.0"
}
```

## Frontend Deployment (Vercel)

### 1. Setup Vercel Project

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your repository
vercel link
```

### 2. Configure Environment Variables

In Vercel dashboard, add these environment variables:

```env
# API Configuration
VITE_API_URL=https://your-backend.railway.app
VITE_WS_URL=wss://your-backend.railway.app

# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Deploy Frontend

The `vercel.json` configuration is already set up. Deploy with:

```bash
# Using Vercel CLI
vercel --prod

# Or push to GitHub and Vercel will auto-deploy
git push origin main
```

### 4. Configure Domain (Optional)

In Vercel dashboard:
1. Go to project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Database Setup (SurrealDB Cloud)

### 1. Create SurrealDB Cloud Instance

1. Go to [SurrealDB Cloud](https://surrealdb.com/cloud)
2. Create a new instance
3. Select your preferred region
4. Note the connection URL, username, and password

### 2. Initialize Database Schema

Connect to your SurrealDB instance and run the schema:

```bash
# From your local machine
surreal import \
  --conn https://your-instance.surreal.cloud \
  --user root --pass root \
  --ns couples_therapy --db main \
  backend/src/db/schema.surql
```

Or the schema will auto-initialize when the backend starts.

## Redis Setup

### Option A: Redis Cloud

1. Create account at [Redis Cloud](https://redis.com/try-free)
2. Create a new database
3. Copy the connection URL
4. Add to Railway environment variables as `REDIS_URL`

### Option B: Upstash

1. Create account at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the connection URL
4. Add to Railway environment variables as `REDIS_URL`

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication with Email/Password

### 2. Get Firebase Credentials

**For Frontend** (Firebase SDK config):
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Create a web app if not exists
4. Copy the firebaseConfig values

**For Backend** (Service Account):
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `project_id`, `private_key`, and `client_email`

## Post-Deployment Checklist

### Backend Verification

- [ ] Health endpoint returns 200 OK
- [ ] Database connection is successful
- [ ] Redis connection is working
- [ ] WebSocket server is running
- [ ] API endpoints respond correctly

### Frontend Verification

- [ ] Site loads without errors
- [ ] Firebase authentication works
- [ ] API calls reach backend
- [ ] WebSocket connection established
- [ ] All pages render correctly

### Security Verification

- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured correctly
- [ ] Rate limiting is active
- [ ] Environment variables are secure
- [ ] Firebase security rules are set

## Monitoring and Logs

### Railway Logs

```bash
# View backend logs
railway logs

# Follow logs in real-time
railway logs --follow
```

### Vercel Logs

```bash
# View frontend logs
vercel logs

# View deployment logs
vercel inspect <deployment-url>
```

### Health Monitoring

Set up uptime monitoring for:
- Backend health endpoint: `https://your-backend.railway.app/health`
- Frontend: `https://your-frontend.vercel.app`

Recommended tools:
- [UptimeRobot](https://uptimerobot.com)
- [Better Uptime](https://betteruptime.com)
- [Cronitor](https://cronitor.io)

## Troubleshooting

### Backend Issues

**Database connection fails:**
```bash
# Check SurrealDB credentials
railway logs | grep "SurrealDB"

# Verify environment variables
railway variables
```

**Redis connection fails:**
```bash
# Check Redis URL format
railway logs | grep "Redis"

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

**Health check fails:**
```bash
# Check health endpoint
curl https://your-backend.railway.app/health

# View detailed logs
railway logs --follow
```

### Frontend Issues

**API calls fail:**
- Verify `VITE_API_URL` points to correct backend
- Check CORS configuration in backend
- Ensure backend is deployed and healthy

**Authentication fails:**
- Verify Firebase credentials are correct
- Check Firebase Authentication is enabled
- Review browser console for errors

**Build fails:**
```bash
# Test build locally
cd frontend
npm run build

# Check Vercel build logs
vercel logs
```

## Scaling Considerations

### Backend Scaling

Railway auto-scales based on demand. For manual control:
1. Go to Railway project settings
2. Adjust instance size
3. Configure auto-scaling rules

### Database Scaling

SurrealDB Cloud provides:
- Automatic backups
- Point-in-time recovery
- Vertical scaling (upgrade instance size)

### Redis Scaling

Both Redis Cloud and Upstash offer:
- Automatic scaling
- High availability options
- Multi-region replication

## Backup and Recovery

### Database Backups

```bash
# Export SurrealDB data
surreal export \
  --conn https://your-instance.surreal.cloud \
  --user root --pass root \
  --ns couples_therapy --db main \
  backup.surql

# Import backup
surreal import \
  --conn https://your-instance.surreal.cloud \
  --user root --pass root \
  --ns couples_therapy --db main \
  backup.surql
```

### Environment Variables Backup

Keep a secure copy of all environment variables in a password manager or encrypted file.

## CI/CD Pipeline

Both Railway and Vercel support automatic deployments from Git:

1. **Push to main branch** → Auto-deploy to production
2. **Push to other branches** → Create preview deployments
3. **Pull requests** → Automatic preview URLs

### GitHub Actions (Optional)

For additional CI/CD control, see `.github/workflows/` directory.

## Cost Optimization

### Railway
- Free tier: 512 MB RAM, $5 credit/month
- Pro plan: Pay per usage
- Estimated cost: $5-20/month depending on traffic

### Vercel
- Free tier: Generous limits for personal projects
- Pro plan: $20/month for teams
- Bandwidth charges may apply

### SurrealDB Cloud
- Free tier: Available during beta
- Paid tiers: TBD

### Redis Cloud
- Free tier: 30 MB
- Paid tiers: Starting at $5/month

## Support and Resources

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [SurrealDB Docs](https://surrealdb.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Project Issues](https://github.com/your-org/couples-therapy-assistant/issues)
