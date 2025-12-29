# Couples Therapy Assistant

AI-powered relationship conflict resolution platform that helps couples work through disagreements with structured therapeutic guidance.

## Features

- **Individual Exploration**: Each partner shares their perspective privately with an AI therapist
- **AI-Mediated Guidance**: Personalized guidance based on both perspectives using therapeutic frameworks (Gottman, EFT, NVC)
- **Multiple Guidance Modes**: Structured (clinical), Conversational (warm), or Test mode
- **Real-time Communication**: WebSocket-based chat for seamless interaction
- **Relationship Tracking**: Track conflicts, patterns, and progress over time

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SurrealDB Cloud
- **Auth**: Firebase Authentication
- **AI**: OpenAI GPT-4
- **Queue**: BullMQ + Redis

## Getting Started

### Prerequisites

- Node.js 18+
- Redis (for job queue)
- SurrealDB Cloud account
- Firebase project
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vadimalpha/couples-therapy-assistant.git
cd couples-therapy-assistant
```

2. Install backend dependencies:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your credentials
```

4. Start development servers:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for Vercel (frontend) and Railway (backend).

## License

MIT
