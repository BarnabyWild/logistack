# @logistack/shared

Shared types, Zod validation schemas, and utilities for the Logistack platform.

## Overview

This package contains code shared between the frontend (Next.js) and backend (Fastify) applications. It ensures type safety and consistent validation across the entire stack.

## Directory Structure

```
@logistack/shared/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── schemas/        # Zod validation schemas
│   ├── utils/          # Shared utility functions
│   └── index.ts        # Main export file
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### In Backend (Fastify)

```typescript
import { userTypeSchema, emailSchema, User } from '@logistack/shared';

// Use schemas for validation
const result = emailSchema.safeParse('user@example.com');

// Use types for type safety
const user: User = {
  id: '123',
  email: 'user@example.com',
  user_type: 'trucker',
  // ...
};
```

### In Frontend (Next.js)

```typescript
import { ApiResponse, paginationSchema, formatDate } from '@logistack/shared';

// Use utility functions
const formattedDate = formatDate(new Date());

// Use schemas for client-side validation
const paginationData = paginationSchema.parse({ page: 1, limit: 10 });
```

## Contents

### Types (`src/types/`)

- **UserType**: User role types (`'trucker' | 'business'`)
- **User**: Base user interface
- **ApiResponse**: Standard API response wrapper
- **ApiError**: Error format
- **PaginationParams**: Pagination parameters
- **PaginatedResponse**: Paginated response format

### Schemas (`src/schemas/`)

- **userTypeSchema**: Validates user types
- **emailSchema**: Email validation
- **passwordSchema**: Password strength validation
- **paginationSchema**: Pagination parameter validation
- **idSchema**: UUID validation
- **phoneSchema**: Phone number validation
- **dateStringSchema**: ISO date string validation

### Utils (`src/utils/`)

- **formatDate**: Convert Date to ISO string
- **parseDate**: Parse ISO string to Date
- **isDefined**: Type guard for defined values
- **delay**: Async delay helper
- **generateTempId**: Generate temporary IDs
- **capitalize**: Capitalize string
- **truncate**: Truncate string with ellipsis

## Development

### Type Checking

```bash
npm run typecheck
```

## Dependencies

- **zod**: Runtime validation and type inference
- **typescript**: Type checking and compilation

## Best Practices

1. **Add new types**: Place in `src/types/index.ts`
2. **Add new schemas**: Place in `src/schemas/index.ts`
3. **Add new utilities**: Place in `src/utils/index.ts`
4. **Export everything**: Update `src/index.ts` to export new modules
5. **Keep it pure**: No external dependencies except Zod and TypeScript
6. **Document everything**: Add JSDoc comments to exports

## Future Additions

- Load/Shipment types and schemas
- Business/Trucker specific types
- Geolocation utilities
- Date/time formatting helpers
- Validation error formatters
- API client types
