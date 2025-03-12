# Monorepo Documentation

## Overview

The Success Kid Platform is structured as a monorepo using Turborepo and PNPM workspaces. This architecture allows for efficient code sharing and dependency management across multiple applications and packages.

## Repository Structure

```
success-kid-platform/
├── apps/
│   ├── frontend/        # Next.js web application
│   └── backend/         # Fastify API service
├── packages/
│   ├── ui/              # Shared UI components
│   ├── types/           # Shared TypeScript types
│   ├── config/          # Shared configuration
│   └── utils/           # Common utilities
└── docs/                # Project documentation
```

## Workspaces

The monorepo is organized into two main types of workspaces:

### Apps

Applications that are deployed independently:

- **frontend**: A Next.js web application
- **backend**: A Fastify API server

### Packages

Shared libraries that are consumed by apps or other packages:

- **ui**: React components shared across applications
- **types**: TypeScript types shared between frontend and backend
- **utils**: Common utility functions
- **config**: Shared configuration for ESLint, TypeScript, Prettier, and Jest

## Dependency Management

Dependencies are managed using PNPM workspaces. This allows packages to reference each other using the `workspace:*` protocol.

To add a dependency to a specific workspace:

```bash
pnpm add <package> --filter=<workspace>
```

## Build System

Turborepo is used to manage the build process:

- **Dependencies**: The build system is aware of the dependency graph between packages
- **Caching**: Turborepo caches build artifacts for faster subsequent builds
- **Parallelization**: Builds are run in parallel when possible

## Configuration Sharing

Common configuration is shared via the `@success-kid/config` package:

- **ESLint**: Shared ESLint configurations for different project types
- **TypeScript**: Shared TypeScript configurations
- **Prettier**: Common Prettier configuration
- **Jest**: Shared Jest test configurations

## Creating New Packages

To create a new package:

1. Create a new directory in the appropriate workspace (`apps/` or `packages/`)
2. Initialize a `package.json` with the correct name and dependencies
3. Set up the appropriate build configuration
4. Add the package to the dependency list of any consuming packages

## Best Practices

- Keep packages focused and small
- Avoid circular dependencies
- Use the shared configurations to maintain consistency
- Document the purpose and API of each package
- Use TypeScript for type safety across package boundaries

## Common Commands

- **Install dependencies**: `pnpm install`
- **Build all packages**: `pnpm build`
- **Development mode**: `pnpm dev`
- **Run tests**: `pnpm test`
- **Lint all code**: `pnpm lint`
- **Format all code**: `pnpm format`
- **Clean build artifacts**: `pnpm clean`