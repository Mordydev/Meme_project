# Success Kid Community Platform Frontend

This is the frontend application for the Success Kid Community Platform, built with Next.js, React, TypeScript, and Tailwind CSS.

## Directory Structure

The application follows a feature-based organization pattern with clear separation of concerns:

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication route group
│   │   │   ├── login/          # Login page
│   │   │   └── register/       # Registration page
│   │   ├── (marketing)/        # Public marketing route group
│   │   │   └── page.tsx        # Landing page
│   │   ├── (platform)/         # Authenticated platform route group
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── community/      # Community pages
│   │   │   └── profile/        # User profile
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Root page
│   ├── components/             # React components
│   │   ├── ui/                 # Generic UI components
│   │   ├── features/           # Feature-specific components
│   │   ├── layout/             # Layout components
│   │   └── providers/          # Context providers
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── store/                  # State management
│   ├── styles/                 # Global styles
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── next.config.js              # Next.js configuration
├── package.json                # Package configuration
└── tsconfig.json               # TypeScript configuration
```

## Component Hierarchy

The application follows a 5-level component hierarchy:

1. **Foundation Components** (in `components/ui`)
   - Basic UI elements with no business logic
   - Highly reusable across the entire application

2. **Composite Components** (in `components/ui` or specific feature directories)
   - Combinations of foundation components
   - Encapsulate common UI patterns

3. **Feature Components** (in `components/features/{feature-name}`)
   - Implement specific business features
   - Combine multiple composite components

4. **Layout Components** (in `components/layout`)
   - Structure and organize other components
   - Handle responsive behavior and positioning

5. **Page Components** (in `app/**/page.tsx`)
   - Top-level components for complete views
   - Compose feature components into complete pages

## Routing Structure

The application uses route groups (in parentheses) to organize routes without affecting URLs:

- `(auth)`: Authentication-related pages (login, register)
- `(marketing)`: Public marketing pages (landing page)
- `(platform)`: Protected application pages for authenticated users

## State Management

- **UI State**: React's useState/useReducer for component-local state
- **Feature State**: Zustand stores organized by feature
- **Server State**: React Query for data fetching and caching
- **Global State**: Zustand for truly global state (authentication, theme, etc.)

## Development Guidelines

### Component Creation

- Use appropriate directory based on component type and purpose
- Create TypeScript interfaces for props
- Implement proper error handling
- Include JSDoc comments for complex components

### TypeScript Usage

- Use strict type checking
- Create explicit interfaces for domain entities
- Use generics for reusable components and hooks
- Avoid `any` types whenever possible

### File Naming Conventions

- **Components**: PascalCase (e.g., `Button.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePoints.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `User.ts`)

## Authentication

The application uses Clerk for authentication, with protected routes in the `(platform)` route group.

## Styling

The application uses Tailwind CSS for styling, with a design system based on design tokens.

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check for code issues
- `npm test`: Run tests
