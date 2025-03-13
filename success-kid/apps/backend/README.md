# Success Kid Backend

This is the backend API service for the Success Kid Community Platform, built with Node.js, Fastify, and TypeScript.

## Technology Stack

- **Node.js 22.3+** - Runtime environment
- **Fastify 5.2+** - API framework
- **TypeScript 5.4+** - Type safety
- **PostgreSQL 17.2+** - Primary database
- **Redis 8.2+** - Caching, pub/sub, job queues
- **Clerk** - Authentication provider
- **Web3.js** - Blockchain integration

## Getting Started

### Prerequisites

- Node.js 22.3+
- PNPM 8.15.0+
- PostgreSQL 17.2+ (or Docker)
- Redis 8.2+ (or Docker)

### Development

1. Install dependencies
```bash
pnpm install
```

2. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Run the development server
```bash
pnpm dev
```

4. The API will be available at [http://localhost:3001](http://localhost:3001)

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run linting
pnpm lint

# Run database migrations
pnpm migrate

# Create a new migration
pnpm migrate:create migration_name
```

## Project Structure

```
backend/
├── src/
│   ├── api/                  # API route handlers
│   │   ├── auth/             # Authentication endpoints
│   │   ├── content/          # Content management endpoints
│   │   ├── points/           # Points system endpoints
│   │   ├── users/            # User management endpoints
│   │   └── wallet/           # Wallet integration endpoints
│   ├── config/               # Application configuration
│   ├── lib/                  # Shared utilities and helpers
│   ├── middleware/           # HTTP middleware
│   ├── models/               # Data models and schemas
│   ├── plugins/              # Fastify plugins
│   ├── repositories/         # Data access layer
│   ├── services/             # Business logic services
│   ├── websockets/           # WebSocket handlers
│   └── app.ts                # Fastify app setup
├── migrations/               # Database migrations
└── openapi/                  # OpenAPI definitions
```

## API Documentation

API documentation is automatically generated using OpenAPI/Swagger:

1. Start the development server
```bash
pnpm dev
```

2. Open [http://localhost:3001/documentation](http://localhost:3001/documentation) to see the API documentation

## Environment Variables

The following environment variables are required:

- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `JWT_SECRET` - Secret for JWT token generation
- `CORS_ORIGIN` - Allowed CORS origin

Create a `.env.local` file in the backend directory with these variables for local development.

## Database Migrations

The project uses a simple SQL-based migration system:

1. Create a new migration
```bash
pnpm migrate:create migration_name
```

2. Edit the newly created migration file in the `migrations` directory

3. Run migrations
```bash
pnpm migrate
```

## WebSocket Support

The backend provides WebSocket support for real-time features:

- Connection endpoint: `ws://localhost:3001/ws`
- Authentication using JWT token
- Event-based message format:
```json
{
  "event": "event_name",
  "data": {},
  "timestamp": "2025-03-12T12:00:00Z"
}
```

## Development Guidelines

- Follow the established architectural patterns (repositories, services, controllers)
- Use TypeScript for type safety
- Document all API endpoints with OpenAPI annotations
- Write tests for all new endpoints and services
- Follow consistent error handling patterns
- Maintain backward compatibility for API changes
- Optimize database queries for performance

## Error Handling

The API uses a standardized error response format:

```json
{
  "data": null,
  "meta": {
    "timestamp": "2025-03-12T12:00:00Z",
    "requestId": "req_123456"
  },
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Human-readable error message",
      "details": []
    }
  ]
}
```

## Learn More

- [Fastify Documentation](https://fastify.dev/docs/latest/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Project Documentation](../../docs)
