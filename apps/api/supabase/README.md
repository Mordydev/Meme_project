# Success Kid Community Platform - Supabase Backend

This directory contains the Supabase backend configuration for the Success Kid Community Platform.

## Directory Structure

```
apps/api/supabase/
├── config.toml           # Supabase configuration
├── migrations/           # Database migrations
│   ├── 01_initial_schema.sql       # Initial database schema
│   ├── 02_row_level_security.sql   # Row Level Security policies
│   └── 03_database_functions.sql   # Database functions and triggers
├── seed-data/            # Seed data for development
│   ├── categories.sql    # Category seed data
│   └── achievements.sql  # Achievement seed data
└── functions/            # Edge Functions
    ├── wallet-verification/  # Wallet verification function
    ├── user-points/          # User points calculation function
    └── market-data/          # Market data fetching function
```

## Setup Instructions

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker](https://www.docker.com/get-started)

### Local Development

1. Start the local Supabase instance:

```bash
supabase start
```

2. Apply migrations:

```bash
supabase db push
```

3. Load seed data:

```bash
supabase db execute < apps/api/supabase/seed-data/categories.sql
supabase db execute < apps/api/supabase/seed-data/achievements.sql
```

4. Deploy Edge Functions:

```bash
supabase functions deploy wallet-verification
supabase functions deploy user-points
supabase functions deploy market-data
```

### Production Deployment

1. Link to your Supabase project:

```bash
supabase link --project-ref <project-ref>
```

2. Deploy migrations:

```bash
supabase db push
```

3. Deploy Edge Functions:

```bash
supabase functions deploy wallet-verification
supabase functions deploy user-points
supabase functions deploy market-data
```

## Database Schema

The database schema includes the following tables:

- `users`: User profiles and metadata
- `wallet_connections`: User wallet connections
- `categories`: Content categories
- `posts`: User posts
- `comments`: Post comments
- `user_points`: User point transactions
- `achievements`: Available achievements
- `user_achievements`: User earned achievements
- `market_snapshots`: Token market data snapshots
- `notifications`: User notifications

## Edge Functions

### Wallet Verification

Verifies wallet ownership through signature verification.

**Endpoint**: `/functions/v1/wallet-verification`

**Request**:
```json
{
  "address": "0x...",
  "message": "Sign this message to verify wallet ownership",
  "signature": "0x..."
}
```

### User Points

Handles point calculations and updates for user actions.

**Endpoint**: `/functions/v1/user-points`

**Request**:
```json
{
  "userId": "uuid",
  "action": "post_created",
  "referenceId": "uuid"
}
```

### Market Data

Fetches and stores token market data.

**Endpoint**: `/functions/v1/market-data`

**Request**: No parameters required

## Row Level Security

Row Level Security (RLS) policies are implemented to ensure data security:

- Users can only view and update their own profiles
- Users can only manage their own wallet connections
- Users can create, update, and delete their own posts and comments
- All users can view posts and comments
- Users can only view their own point transactions and achievements

## Database Functions

- `get_user_total_points`: Calculates total points for a user
- `check_achievement_eligibility`: Checks if a user has earned an achievement

## Triggers

- `check_achievements_after_points`: Checks achievements after points are added
- `check_achievements_after_post`: Checks achievements after a post is created or updated
- `check_achievements_after_comment`: Checks achievements after a comment is created 