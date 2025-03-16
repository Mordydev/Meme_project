# Success Kid Community Platform - Backend API

This is the backend API for the Success Kid Community Platform. It provides a robust, scalable, and secure API for the platform's frontend, designed to support high performance, real-time features, and a seamless user experience.

## Features

- RESTful API with WebSocket support for real-time updates
- Points system with transaction management
- Feature flag system for controlled feature rollout
- Health check and monitoring for operational visibility
- Repository pattern for data access
- Error handling framework with standardized responses
- Environment configuration with validation
- Transaction verification for idempotent operations
- Database connection pooling and Redis integration
- Docker development environment

## Technology Stack

- **Node.js 22.3+**: Modern JavaScript runtime
- **Fastify 5.2+**: High-performance web framework
- **TypeScript 5.4+**: Type-safe JavaScript
- **PostgreSQL 17.2+**: Relational database
- **Redis 8.2+**: Caching, pub/sub, job queues
- **Clerk 5.3+**: Authentication
- **Web3.js 4.0+**: Blockchain integration

## Getting Started

### Prerequisites

- Node.js 22.3+
- pnpm 9.0+
- Docker and Docker Compose (for development environment)

### Using Docker (Recommended)

1. Clone the repository and navigate to the project root:

```bash
git clone https://github.com/your-org/success-kid-platform.git
cd success-kid-platform
```

2. Start the development environment:

```bash
cd docker/development
docker-compose up
```

This will start the backend API, PostgreSQL, and Redis in containers, with hot reloading enabled for development.

### Manual Setup

1. Clone the repository and navigate to the project root:

```bash
git clone https://github.com/your-org/success-kid-platform.git
cd success-kid-platform
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp apps/backend/.env.example apps/backend/.env.local
```

4. Start PostgreSQL and Redis locally or configure environment variables to point to existing instances.

5. Start the development server:

```bash
pnpm --filter @success-kid/backend dev
```

## API Documentation

API documentation is available at `/documentation` endpoint when the server is running. It provides an interactive Swagger UI for exploring the API.

## Project Structure

```
backend/
├── src/
│   ├── api/                  # API route handlers
│   │   ├── health/           # Health check routes
│   │   ├── features/         # Feature flag routes
│   │   └── points/           # Points system routes
│   ├── config/               # Application configuration
│   │   ├── index.ts          # Configuration exports
│   │   ├── environment.ts    # Environment variables
│   │   ├── database.ts       # Database configuration
│   │   └── redis.ts          # Redis configuration
│   ├── errors/               # Error handling framework
│   │   ├── base-error.ts     # Base error classes
│   │   ├── api-errors.ts     # API-specific errors
│   │   ├── handlers.ts       # Error handlers
│   │   └── serializers.ts    # Error serialization
│   ├── health/               # Health check and monitoring
│   │   ├── checks.ts         # Health check implementations
│   │   └── monitoring.ts     # System monitoring utilities
│   ├── lib/                  # Shared utilities
│   │   ├── db-client.ts      # Database client singletons
│   │   └── logger.ts         # Logging utility
│   ├── middleware/           # HTTP middleware
│   │   ├── transaction-verification.ts  # Idempotent operations
│   │   └── feature-flag-middleware.ts   # Feature flag checks
│   ├── models/               # Data models and schemas
│   ├── plugins/              # Fastify plugins
│   │   ├── database/         # Database plugin
│   │   ├── redis/            # Redis plugin
│   │   └── swagger.ts        # API documentation plugin
│   ├── repositories/         # Data access layer
│   │   ├── base-repository.ts # Base repository class
│   │   └── points-repository.ts # Points repository
│   ├── services/             # Business logic services
│   │   └── feature-flag-service.ts # Feature flag service
│   ├── websockets/           # WebSocket handlers
│   │   ├── connection-manager.ts # Connection management
│   │   ├── auth.ts           # WebSocket authentication
│   │   ├── handlers.ts       # WebSocket event handlers
│   │   └── plugin.ts         # WebSocket Fastify plugin
│   ├── app.ts                # Fastify app setup
│   ├── server.ts             # Server entry point
│   └── index.ts              # Application entry point
├── test/                     # Test files
└── package.json              # Package dependencies
```

## Development Workflow

### Code Quality

- **Linting**: Run `pnpm lint` to check for code quality issues
- **Type Checking**: Run `pnpm type-check` to verify TypeScript types
- **Testing**: Run `pnpm test` to run tests

### Database Migrations

Migrations are located in the `migrations` directory and can be run using:

```bash
pnpm migrate
```

To create a new migration:

```bash
pnpm migrate:create migration-name
```

### API Documentation

API documentation is automatically generated using OpenAPI/Swagger annotations in the route handlers. You can access the documentation by navigating to `/documentation` when the server is running.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development, test, production) | `development` |
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `0.0.0.0` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://dev:dev@localhost:5432/successKidPlatform` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT signing | `dev-jwt-secret` (in development) |
| `LOG_LEVEL` | Logging level | `info` in production, `debug` in development |

## License

This project is licensed under the MIT License - see the LICENSE file for details.
