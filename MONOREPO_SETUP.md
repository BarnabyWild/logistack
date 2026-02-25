# Logistack Monorepo Setup

This document describes the monorepo structure and workspace configuration for Logistack.

## Package Manager

This project uses **pnpm** with workspaces for efficient dependency management across packages.

### Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm@8.15.4

# Install all dependencies
pnpm install
```

## Workspace Structure

```
logistack/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Fastify backend API
├── packages/
│   ├── db/           # Database schemas and Drizzle ORM
│   ├── shared/       # Shared types, schemas, and utilities
│   ├── auth/         # Authentication and authorization
│   └── ui/           # Reusable React UI components
├── package.json      # Root workspace configuration
├── pnpm-workspace.yaml
├── tsconfig.json     # Root TypeScript configuration
└── tsconfig.base.json # Base config for packages to extend
```

## TypeScript Path Aliases

The following path aliases are configured in `tsconfig.json`:

- `@logistack/db` → `packages/db/src/index.ts`
- `@logistack/shared` → `packages/shared/src/index.ts`
- `@logistack/auth` → `packages/auth/src/index.ts`
- `@logistack/ui` → `packages/ui/src/index.ts`

### Using Path Aliases

```typescript
// Import from any package
import { db } from '@logistack/db';
import { validateEmail } from '@logistack/shared';
import { requireAuth } from '@logistack/auth';
import { Button } from '@logistack/ui';
```

## Workspace Dependencies

Packages can depend on each other using the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@logistack/db": "workspace:*",
    "@logistack/shared": "workspace:*"
  }
}
```

## Scripts

### Root Level Scripts

```bash
# Development
pnpm dev              # Run all apps in dev mode (parallel)
pnpm web:dev          # Run only web app
pnpm api:dev          # Run only API

# Build
pnpm build            # Build all packages and apps

# Type Checking
pnpm type-check       # Run TypeScript type checking across all packages

# Database
pnpm db:generate      # Generate database migrations
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Drizzle Studio

# Maintenance
pnpm clean            # Remove all node_modules and build artifacts
```

### Working with Individual Packages

```bash
# Run a command in a specific package
pnpm --filter @logistack/web dev
pnpm --filter @logistack/api build

# Run a command in all packages
pnpm --recursive run type-check

# Add a dependency to a specific package
pnpm --filter @logistack/web add react-query
pnpm --filter @logistack/api add -D @types/node
```

## Shared devDependencies

Common development dependencies are hoisted to the root `package.json`:

- `typescript` - Shared TypeScript version across all packages
- `@types/*` - Common type definitions
- `prettier` - Code formatting
- `drizzle-kit` - Database toolkit
- `tsx` - TypeScript execution

## Configuration Files

### `.npmrc`

Configures pnpm behavior:
- Auto-installs peer dependencies
- Links workspace packages
- Uses isolated node linker for better dependency isolation

### `pnpm-workspace.yaml`

Defines workspace packages:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `tsconfig.json`

Root TypeScript configuration with path aliases for all `@logistack/*` packages.

### `tsconfig.base.json`

Base TypeScript configuration that individual packages can extend.

## Best Practices

1. **Use workspace protocol**: Always use `workspace:*` for internal package dependencies
2. **Shared versions**: Keep common dependencies (TypeScript, React, etc.) at the same version
3. **Path aliases**: Use `@logistack/*` imports instead of relative paths
4. **Filter commands**: Use `--filter` to run commands on specific packages
5. **Parallel execution**: Use `--parallel` for independent tasks (dev servers, tests)

## Migrating from npm

If you have an existing `package-lock.json`, remove it and install with pnpm:

```bash
rm package-lock.json
rm -rf node_modules
pnpm install
```

## Troubleshooting

### Dependency resolution issues

```bash
# Clear pnpm cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

### TypeScript path resolution issues

1. Ensure your package's `tsconfig.json` extends the base config
2. Check that path aliases in `tsconfig.json` point to the correct locations
3. Restart your TypeScript server in your IDE

### Build order issues

pnpm will automatically build dependencies in the correct order based on `workspace:*` declarations.
