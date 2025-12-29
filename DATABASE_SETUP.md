# Database Setup

## Overview

This project uses SurrealDB Cloud for data storage. The database layer includes:

- **Connection utility** (`src/utils/db.ts`) - Singleton pattern for managing database connections
- **Schema definition** (`src/db/schema.sql`) - SurrealQL schema with tables for users, relationships, conflicts, and conversations
- **Schema runner** (`src/scripts/init-schema.ts`) - Script to initialize the database schema

## Database Structure

### Tables

1. **users** - User accounts (synced from Firebase)
   - firebase_uid (unique)
   - email (unique)
   - display_name
   - intake_completed
   - intake_data

2. **relationships** - Partner connections
   - partner_a_id
   - partner_b_id (optional, for pending invitations)
   - status (pending/active/unpaired)
   - invitation_token
   - invitation_email

3. **conflicts** - Relationship conflicts/issues
   - relationship_id
   - created_by
   - title
   - status (exploring/synthesizing/guidance/shared/archived)
   - privacy_setting (private/shared)

4. **conversation_sessions** - Individual conversation threads
   - conflict_id
   - user_id
   - session_type (individual_a/individual_b/joint_context_a/joint_context_b/relationship_shared)
   - status (active/finalized)

5. **conversation_messages** - Chat messages
   - session_id
   - role (user/assistant)
   - sender_id
   - content
   - tokens_used

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your SurrealDB Cloud credentials:

```bash
cp .env.example .env
```

Update the following variables in `.env`:
- `SURREAL_URL` - Your SurrealDB Cloud WebSocket URL
- `SURREAL_USERNAME` - Admin username
- `SURREAL_PASSWORD` - Admin password
- `SURREAL_NAMESPACE` - Namespace name (default: couples_therapy)
- `SURREAL_DATABASE` - Database name (default: main)

### 3. Initialize Schema

```bash
npm run init-db
```

This will:
1. Connect to SurrealDB Cloud
2. Create the namespace and database (if they don't exist)
3. Execute all schema definitions
4. Create tables with proper constraints and indexes

## Known Issues

### Authentication Error

Currently experiencing authentication issues with the provided SurrealDB Cloud credentials:

```
ResponseError: There was a problem with the database: There was a problem with authentication
```

**Possible causes:**
1. Incorrect credentials (username/password)
2. Cloud instance not accessible or paused
3. Need to use different authentication method (API token vs username/password)
4. Namespace/database permissions not set correctly

**Next steps to resolve:**
1. Verify the SurrealDB Cloud instance is active and accessible
2. Confirm the admin credentials are correct
3. Check if the instance requires a different authentication flow
4. Consider creating a new user with explicit namespace/database permissions

## Usage

### Get Database Connection

```typescript
import { getDb } from './utils/db';

async function example() {
  const db = await getDb();

  // Run a query
  const result = await db.query('SELECT * FROM users');

  console.log(result);
}
```

### Close Connection

```typescript
import { closeDb } from './utils/db';

await closeDb();
```

## Development

The database utility uses a singleton pattern to ensure only one connection exists throughout the application lifecycle. The connection is automatically initialized on first use and can be reused across the application.
