# Success Kid Platform

A monorepo for the Success Kid Platform containing both frontend and backend applications, as well as shared packages.

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

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- PNPM (v8.9.0 or later)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

### Development

To start the development servers for all applications:

```bash
pnpm dev
```

To start a specific application:

```bash
pnpm dev --filter=frontend
```

### Building

To build all applications and packages:

```bash
pnpm build
```

To build a specific application or package:

```bash
pnpm build --filter=frontend
```

### Testing

To run tests for all applications and packages:

```bash
pnpm test
```

### Linting

To lint all applications and packages:

```bash
pnpm lint
```

## Workspace Management

This monorepo uses Turborepo and PNPM workspaces to manage the applications and packages. 

### Adding Dependencies

To add a dependency to a specific workspace:

```bash
pnpm add <package> --filter=<workspace>
```

For example, to add React to the frontend application:

```bash
pnpm add react --filter=frontend
```

### Creating a New Package

1. Create a new directory in the `packages/` directory
2. Initialize a new package with the proper name (prefixed with `@success-kid/`)
3. Add the necessary dependencies
4. Reference the package in other workspaces as needed

## Contributing

Please see the [CONTRIBUTING.md](./docs/CONTRIBUTING.md) file for details on our code of conduct and the process for submitting pull requests.

## License

This project is proprietary and confidential.
