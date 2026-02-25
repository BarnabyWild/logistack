# @logistack/auth

Authentication and authorization utilities for the Logistack platform.

## Features

- **Password Hashing**: Secure password hashing using bcrypt
- **JWT Token Management**: Generate and verify JSON Web Tokens
- **Authentication Middleware**: Express/Fastify middleware for protecting routes
- **Authorization Utilities**: Role-based access control helpers

## Installation

This package is part of the Logistack monorepo and uses workspace dependencies.

## Dependencies

- `bcrypt`: Password hashing
- `jsonwebtoken`: JWT token management
- `@logistack/shared`: Shared types and utilities

## Directory Structure

```
src/
├── middleware/     # Authentication and authorization middleware
├── utils/          # Utility functions for auth operations
└── index.ts        # Main entry point
```

## Usage

```typescript
import { /* utilities */ } from '@logistack/auth';

// Example usage will be added as utilities are implemented
```

## Development

```bash
# Type check
npm run typecheck
```
