# Wild 'n Out Meme Coin Platform Development Guide

This guide outlines the development environment setup and workflow for the Wild 'n Out Meme Coin Platform project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Environment Variables](#environment-variables)
6. [Code Quality](#code-quality)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/wildnout-platform.git
   cd wildnout-platform
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   # For frontend
   cp apps/frontend/.env.example apps/frontend/.env.local
   
   # For backend
   cp apps/backend/.env.example apps/backend/.env
   ```

4. Start the development servers:
   ```
   npm run dev
   ```

## Development Environment Setup

### Recommended Tools

- **IDE**: Visual Studio Code with recommended extensions
- **Node Version Manager**: nvm or fnm for managing Node.js versions
- **API Testing**: Postman or Insomnia
- **Database Management**: TablePlus or Supabase UI

### VS Code Extensions

We recommend installing the extensions listed in `.vscode/extensions.json`:

- ESLint
- Prettier
- TypeScript and JavaScript support
- Tailwind CSS IntelliSense
- DotENV
- Auto Rename Tag
- Code Spell Checker
- Color Highlight
- Docker

## Project Structure

The project follows a monorepo structure using npm workspaces and Turborepo:

```
wildnout-platform/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # Fastify backend service
├── packages/
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utilities
├── docs/                  # Documentation
└── package.json           # Root package.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and services
│   ├── types/             # TypeScript types
│   └── middleware.ts      # Next.js middleware
├── public/                # Static assets
└── package.json           # Package configuration
```

### Backend Structure

```
backend/
├── src/
│   ├── api/               # API routes
│   ├── config/            # Configuration
│   ├── lib/               # Utilities
│   ├── middleware/        # Request middleware
│   ├── models/            # Data models
│   ├── plugins/           # Fastify plugins
│   ├── repositories/      # Data access layer
│   ├── services/          # Business logic
│   └── index.ts           # Application entry point
├── test/                  # Test files
└── package.json           # Package configuration
```

## Development Workflow

### Running the Development Servers

1. Start both frontend and backend:
   ```
   npm run dev
   ```

2. Or start a specific application:
   ```
   # Frontend only
   npm run dev --filter=@wildnout/frontend
   
   # Backend only
   npm run dev --filter=@wildnout/backend
   ```

3. For TurboMode in Next.js:
   ```
   npm run dev:turbo --filter=@wildnout/frontend
   ```

4. For debugging the backend:
   ```
   npm run dev:debug --filter=@wildnout/backend
   ```

### Running Tests

1. Run all tests:
   ```
   npm test
   ```

2. Run tests for a specific application:
   ```
   npm run test:frontend
   npm run test:backend
   ```

3. Run tests in watch mode:
   ```
   npm run test:watch
   ```

4. Run tests with coverage:
   ```
   npm run test:coverage
   ```

### Linting and Formatting

1. Run linting:
   ```
   npm run lint
   ```

2. Fix linting issues:
   ```
   npm run lint:fix
   ```

3. Code formatting is handled automatically on save if using VS Code with the recommended settings.

### Building for Production

```
npm run build
```

## Environment Variables

### Frontend Environment Variables

See `.env.example` in the frontend directory for required variables:

- Authentication (Clerk)
- API URLs
- Blockchain configuration
- Feature flags

### Backend Environment Variables

See `.env.example` in the backend directory for required variables:

- Server configuration
- Database credentials
- Redis configuration
- Authentication
- Blockchain configuration

## Code Quality

### Coding Standards

We follow these coding standards:

1. **TypeScript**: Use strict mode and explicit types
2. **React**: Use functional components and hooks
3. **CSS**: Use Tailwind CSS utility classes
4. **API**: RESTful design with consistent error handling

### Commit Message Format

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code change that neither fixes a bug nor adds a feature
- test: Adding tests
- chore: Changes to the build process or auxiliary tools

### Pull Request Process

1. Create a branch from `main`
2. Make your changes
3. Ensure tests pass and linting is clean
4. Submit a pull request
5. Request a code review
6. Address review comments
7. Merge once approved

## Testing

See [testing.md](testing.md) for detailed information on our testing approach.

## Troubleshooting

### Common Issues

1. **Node version mismatches**
   - Ensure you're using Node.js 18 or higher
   - Try `nvm use` to switch to the correct version

2. **Dependency issues**
   - Try clearing node_modules: `npm run clean && npm install`

3. **Environment variable problems**
   - Verify all required variables are set
   - Check for typos in variable names

4. **Build failures**
   - Check the error logs for specific issues
   - Ensure TypeScript compilation is successful

### Getting Help

If you encounter issues not covered here:

1. Check existing GitHub issues
2. Ask in the development team chat
3. Create a new issue with detailed information about the problem

---

For more detailed information, refer to the other documentation files in the `docs` directory.
