# Success Kid Community Platform - Backend

This is the backend service for the Success Kid Community Platform, providing RESTful APIs and WebSocket functionality for real-time features.

## Architecture

The backend is built on a modern Node.js stack with:

- **Fastify**: High-performance web framework
- **TypeScript**: Type-safe development
- **PostgreSQL**: Primary database
- **Redis**: Caching, pub/sub, and real-time features
- **WebSockets**: Real-time communication
- **JWT**: Authentication and authorization

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 8+
- Docker and Docker Compose (for local development)

### Development Setup

The easiest way to get started is using Docker Compose:

```bash
# Start the entire development stack
cd docker/development
docker-compose up -d

# View logs
docker-compose logs -f backend
```

Alternatively, you can run the backend service locally:

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Before running locally, make sure to:
1. Copy `.env.example` to `.env.local` and update the values
2. Have PostgreSQL and Redis running (or use the Docker services)

### Environment Variables

Key environment variables include:

- `NODE_ENV`: Environment (`development`, `test`, `production`)
- `PORT`: HTTP server port
- `HOST`: HTTP server host
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT signing

See `.env.example` for a complete list of supported variables.

## API Documentation

When running the server locally, Swagger documentation is available at:
http://localhost:3001/documentation

## Key Features

- **Points System**: Award, track, and redeem points
- **Real-time Updates**: WebSockets for live notifications and data
- **Achievement System**: Track and award user achievements
- **Content Management**: Create and moderate community content
- **Wallet Integration**: Connect and verify blockchain wallets
- **User Management**: Profiles, authentication, and authorization

## Architecture Overview

The backend follows a modular architecture with:

- **API Layer**: RESTful endpoints and request handling
- **Service Layer**: Business logic and feature implementations
- **Repository Layer**: Data access and storage
- **WebSocket Layer**: Real-time communication
- **Security Layer**: Authentication, authorization, and validation

## Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Useful Commands

```bash
# Lint code
pnpm lint

# Type check
pnpm type-check

# Build for production
pnpm build

# Start production build
pnpm start
```

## Docker Development Environment

The Docker development environment includes:

- Backend service (Node.js)
- Frontend service (Next.js)
- PostgreSQL database
- Redis cache
- pgAdmin for database management

To access pgAdmin, open http://localhost:5050 and login with:
- Email: dev@successkid.com
- Password: dev

## Monitoring and Health Checks

- Basic health check: `GET /health`
- Detailed health status: `GET /health/detailed`

## Security Considerations

The backend implements multiple security layers:

- Input validation for all requests
- Authentication and authorization for protected endpoints
- Rate limiting to prevent abuse
- Transaction verification for idempotent operations
- Proper error handling to prevent information leakage

## License

This project is licensed under the terms of the MIT license.