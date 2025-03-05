# Success Kid Community Platform

Transform a viral meme token into a sustainable digital community with real utility and engagement.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (for local development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/success-kid-platform.git
   cd success-kid-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the api directory
   - Update with your own values as needed

4. Start development servers:
   ```bash
   npm run dev
   ```
   This will start both frontend and backend services in parallel.

## Monorepo Structure

This project uses Turborepo to manage a monorepo with multiple packages and applications:

### Applications
- `apps/web`: Frontend React application (Vite + React + TypeScript)
- `apps/api`: Backend API services (Express + TypeScript + MongoDB)

### Packages
- `packages/ui`: Shared UI component library
- `packages/utils`: Shared utility functions
- `packages/eslint-config`: Shared ESLint configuration
- `packages/typescript-config`: Shared TypeScript configuration

## Development Workflow

This project uses GitHub Flow for development:

1. Create a feature branch from `main`
2. Make changes and commit to your branch
3. Open a Pull Request to `main`
4. After review and approval, merge your PR
5. Delete the feature branch

Main branch is protected and requires PR review before merging.

## Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all packages and applications
- `npm run lint` - Lint all packages and applications
- `npm run test` - Run tests across the monorepo
- `npm run format` - Format code with Prettier

## Documentation

- [Architecture Overview](./docs/design.md)
- [Development Guide](./docs/frontend&backend.md)
- [Project Roadmap](./docs/masterplan.md)

## Environment Setup

### Frontend (Web App)

The frontend is built with:
- Vite
- React
- TypeScript
- Tailwind CSS

### Backend (API Server)

The backend is built with:
- Express.js
- TypeScript
- MongoDB (Mongoose)
- JWT Authentication

## Contributing

Please read our [Contributing Guide](./.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](./LICENSE).