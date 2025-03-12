# Contributing Guide

This document outlines the process for contributing to the Success Kid Platform.

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm dev`

## Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes: `pnpm test`
4. Lint your code: `pnpm lint`
5. Build the project to ensure everything compiles: `pnpm build`
6. Commit your changes with a descriptive commit message
7. Push your branch and create a pull request

## Monorepo Structure

The Success Kid Platform is structured as a monorepo using Turborepo and PNPM workspaces. Please see [MONOREPO.md](./MONOREPO.md) for details about the repository structure and development workflow.

## Code Style

We use ESLint and Prettier to enforce code style. The configuration files can be found in the `packages/config` directory.

To format your code:

```bash
pnpm format
```

To lint your code:

```bash
pnpm lint
```

## Testing

We use Jest for testing. Write tests for all new features and bug fixes.

To run tests:

```bash
pnpm test
```

## Creating New Packages

If you need to create a new package:

1. Follow the existing structure and naming conventions
2. Make sure it has proper documentation
3. Add appropriate tests
4. Update dependencies in consuming packages

## Pull Request Process

1. Ensure all tests pass
2. Ensure the code builds without errors
3. Update documentation if necessary
4. Request a review from at least one team member
5. Address any review comments
6. Once approved, your pull request will be merged

## Commit Message Guidelines

We follow conventional commit message format:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example: `feat(frontend): add user profile page`

## Questions?

If you have any questions about contributing, please reach out to the project maintainers.