# Success Kid Frontend

This is the frontend application for the Success Kid Community Platform, built with Next.js, React, and TypeScript.

## Technology Stack

- **Next.js 15.2+** - React framework with App Router
- **React 19.1+** - UI library with Server Components
- **TypeScript 5.4+** - Type safety
- **Tailwind CSS 4.0+** - Styling framework
- **Clerk** - Authentication provider
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **Framer Motion** - Animation

## Getting Started

### Prerequisites

- Node.js 22.3+
- PNPM 8.15.0+

### Development

1. Install dependencies
```bash
pnpm install
```

2. Run the development server
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

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

# Run Storybook (component documentation)
pnpm storybook

# Build Storybook static site
pnpm build-storybook

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication route group
│   ├── (marketing)/        # Public marketing route group
│   ├── (platform)/         # Authenticated platform route group
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Root page
├── src/
│   ├── components/         # React components
│   │   ├── ui/             # Generic UI components
│   │   ├── features/       # Feature-specific components
│   │   └── layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── store/              # State management
│   └── types/              # TypeScript types
├── public/                 # Static assets
└── middleware.ts           # Next.js middleware
```

## Routing Structure

The application uses the Next.js App Router with route groups:

- `(auth)/*` - Authentication routes (login, register)
- `(marketing)/*` - Public marketing pages (landing page, about, etc.)
- `(platform)/*` - Authenticated platform experience

Route groups (in parentheses) don't affect the URL structure but help with code organization.

## Component Documentation

Component documentation is available through Storybook:

1. Run Storybook
```bash
pnpm storybook
```

2. Open [http://localhost:6006](http://localhost:6006) to see the component documentation

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_API_URL` - URL for the backend API
- `NEXT_PUBLIC_WS_URL` - WebSocket URL for real-time features
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication publishable key

Create a `.env.local` file in the frontend directory with these variables for local development.

## Development Guidelines

- Use Server Components by default, only use Client Components when necessary
- Follow the mobile-first approach for responsive design
- Use TypeScript for type safety
- Follow the established component patterns and naming conventions
- Write tests for all new components and features
- Maintain accessibility compliance (WCAG 2.1 AA)
- Document components in Storybook

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Project Documentation](../../docs)
