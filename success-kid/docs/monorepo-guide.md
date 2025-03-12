# Monorepo Development Guide

This document provides detailed guidance on working within the Success Kid Platform monorepo structure.

## Workspace Architecture

Our monorepo is organized into two main workspace types:

1. **Apps**: Deployable applications
   - `frontend`: Next.js web application
   - `backend`: Fastify API service

2. **Packages**: Shared libraries used across applications
   - `ui`: Reusable UI components 
   - `types`: Shared TypeScript types and interfaces
   - `config`: Shared configuration for development tools
   - `utils`: Common utility functions

## Development Workflow

### Getting Started

1. Clone the repository
2. Run `pnpm install` at the root level
3. Use `pnpm dev` to start development servers

### Working with Workspaces

#### Running Commands in Specific Workspaces

To run a command in a specific workspace:

```bash
pnpm --filter <workspace-name> <command>
```

Examples:
- `pnpm --filter frontend dev` - Start only the frontend dev server
- `pnpm --filter backend test` - Run tests only for the backend
- `pnpm --filter @success-kid/ui build` - Build only the UI package

#### Creating a New Component in UI Package

```bash
pnpm --filter @success-kid/ui create-component Button
```

### Dependencies Management

#### Adding a Dependency to a Workspace

```bash
pnpm --filter <workspace-name> add <package-name>
```

Example:
- `pnpm --filter frontend add react-hook-form`

#### Adding a Dependency to All Workspaces

```bash
pnpm add -w <package-name>
```

#### Using Workspace Packages

Reference another workspace package in package.json:

```json
{
  "dependencies": {
    "@success-kid/ui": "workspace:*"
  }
}
```

### Build Cache

Turborepo provides intelligent caching to speed up builds:

- Builds are cached locally by default
- Only changed files are rebuilt
- To force a full rebuild: `pnpm build --force`
- To clear the cache: `pnpm turbo cache clean`

## Code Organization Best Practices

### Package Structure

Each package should follow this general structure:

```
package-name/
├── src/            # Source code
│   └── index.ts    # Main entry point
├── test/           # Test files
├── package.json    # Package metadata
└── tsconfig.json   # TypeScript configuration
```

### Exporting from Packages

Always export through the main entry point:

```typescript
// src/index.ts
export * from './components/Button';
export * from './utils/formatting';
```

### Import Best Practices

```typescript
// Good: Import from the package
import { Button } from '@success-kid/ui';

// Bad: Direct import to internal file
import { Button } from '@success-kid/ui/src/components/Button';
```

## Troubleshooting

### Dependency Issues

If you encounter dependency issues:

1. Delete node_modules directories:
   ```bash
   pnpm clean:modules
   ```
2. Clear PNPM store:
   ```bash
   pnpm store prune
   ```
3. Reinstall dependencies:
   ```bash
   pnpm install
   ```

### Build Issues

If you encounter build issues:

1. Clear Turborepo cache:
   ```bash
   pnpm turbo cache clean
   ```
2. Rebuild all packages:
   ```bash
   pnpm build --force
   ```

## Advanced Topics

### Versioning Strategy

We use synchronized versioning across all packages:

- Version numbers are kept in sync
- Breaking changes trigger a major version bump
- New features trigger a minor version bump
- Bug fixes trigger a patch version bump

### CI/CD Pipeline

Our CI/CD pipeline:

1. Installs dependencies with frozen lockfile
2. Runs linting across all packages
3. Builds all packages with caching
4. Runs tests with coverage reporting
5. Deploys applications if on main branch
