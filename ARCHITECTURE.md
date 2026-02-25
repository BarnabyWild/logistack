# Logistack Architecture Document

## Overview
Logistack is a modern logistics management platform designed to connect truckers with businesses, streamline shipping operations, and provide real-time tracking and management capabilities. This document outlines the complete technology stack and architectural decisions for the platform.

---

## 1. Frontend Framework

### Choice: **Next.js 14+ (React Framework)**

#### Rationale:
- **Server-Side Rendering (SSR)**: Critical for logistics dashboards that need real-time data and SEO optimization for business discovery pages
- **App Router**: Modern routing with built-in layouts, loading states, and error boundaries perfect for complex logistics workflows
- **Server Actions**: Simplified data mutations without explicit API endpoints, reducing boilerplate
- **TypeScript Support**: First-class TypeScript integration ensures type safety across the logistics domain models
- **Performance**: Automatic code splitting and optimization crucial for mobile truckers with varying network conditions
- **Developer Experience**: Hot reloading, built-in optimization, and rich ecosystem accelerate development

#### Key Libraries:
- **React 18+**: Core UI library with concurrent features
- **TanStack Query (React Query)**: Server state management for shipments, loads, and tracking data
- **Zustand**: Lightweight client state management for UI state and filters
- **Tailwind CSS**: Utility-first CSS for rapid UI development
- **Shadcn/ui**: High-quality component library built on Radix UI for accessible components
- **React Hook Form**: Performant form handling for complex logistics forms (load posting, booking)
- **Zod**: Runtime type validation aligned with backend schemas
- **Mapbox GL JS / Leaflet**: Interactive maps for route visualization and geolocation tracking

---

## 2. Backend Framework

### Choice: **Node.js with Fastify**

#### Rationale:
- **Performance**: Fastify is one of the fastest Node.js frameworks, crucial for handling high-frequency location updates and real-time tracking
- **Schema-Based Validation**: Built-in JSON schema validation reduces bugs and provides automatic API documentation
- **TypeScript Native**: Excellent TypeScript support ensures type safety across the entire stack
- **Plugin Architecture**: Modular design allows clean separation of concerns (auth, database, WebSocket)
- **WebSocket Support**: Native support for real-time features (live tracking, notifications)
- **Low Overhead**: Minimal footprint important for cost-effective scaling
- **JSON-First**: Optimized for JSON APIs which is perfect for our REST architecture

#### Alternative Consideration:
Python with FastAPI was considered for its excellent async support and data processing capabilities. However, Node.js was chosen for:
- Full-stack JavaScript/TypeScript consistency
- Better real-time capabilities with WebSocket
- Larger ecosystem for logistics integrations
- Team expertise and faster development velocity

#### Key Libraries:
- **Fastify**: Core HTTP framework
- **@fastify/jwt**: JWT authentication
- **@fastify/websocket**: Real-time communication
- **@fastify/cors**: Cross-origin resource sharing
- **@fastify/helmet**: Security headers
- **node-postgres (pg)**: PostgreSQL client
- **Drizzle ORM**: Type-safe SQL query builder with excellent PostgreSQL support
- **Zod**: Shared validation schemas with frontend
- **Bull**: Job queue for background tasks (email, reports, invoice generation)
- **Pino**: High-performance logging

---

## 3. Database

### Choice: **PostgreSQL 15+**

#### Rationale:
- **Relational Data Model**: Logistics data is highly relational (users, shipments, loads, trucks, routes, invoices)
- **ACID Compliance**: Critical for financial transactions and booking integrity
- **JSONB Support**: Flexible storage for dynamic fields (insurance_info, profile_data) as seen in migrations
- **Geospatial Support (PostGIS)**: Native support for location tracking, route optimization, and proximity searches
- **Full-Text Search**: Built-in search capabilities for finding loads, shipments, and businesses
- **Performance**: Excellent query optimization and indexing for complex joins and aggregations
- **Mature Ecosystem**: Battle-tested with extensive tooling and monitoring solutions
- **Row-Level Security**: Built-in RLS for multi-tenant data isolation between businesses

#### Database Extensions:
- **PostGIS**: Geospatial queries for location tracking and route optimization
- **pg_trgm**: Fuzzy text search for finding loads and businesses
- **uuid-ossp**: UUID generation for distributed ID generation

#### Caching Layer:
- **Redis**: In-memory cache for:
  - Session storage
  - Real-time location data cache
  - Rate limiting
  - Job queue backend (Bull)
  - Pub/sub for real-time notifications

---

## 4. Authentication Strategy

### Choice: **JWT + Refresh Token Strategy with Custom Auth**

#### Rationale:
- **Stateless Authentication**: JWTs enable horizontal scaling without session storage
- **Mobile-Friendly**: Perfect for trucker mobile apps with offline-first capabilities
- **Refresh Token Rotation**: Security best practice with sliding sessions
- **Custom Implementation**: Full control over auth flow for business-specific requirements (MC/DOT verification)
- **Role-Based Access Control**: Native support for user_type ('trucker', 'business') with fine-grained permissions

#### Implementation Details:
- **Access Token**: Short-lived (15 minutes), stored in memory
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie
- **Token Storage**: PostgreSQL table for refresh tokens with revocation support
- **Password Hashing**: bcrypt with cost factor 12
- **MFA Support**: Optional 2FA using TOTP (Time-based One-Time Password)

#### Alternative Considered:
**Auth0 / Supabase Auth** were considered but custom auth was chosen because:
- No monthly active user (MAU) costs as platform scales
- Full control over trucking-specific verification flows (MC/DOT number validation)
- Ability to implement custom business logic (carrier verification, insurance validation)
- No vendor lock-in or API rate limits

#### Future Considerations:
- OAuth 2.0 integration for "Login with Google" for business users
- SSO for enterprise logistics companies

---

## 5. Deployment Platform

### Choice: **Railway (Primary) with AWS (Future)**

#### Rationale for Railway:
- **Rapid Development**: Zero-config deployments perfect for MVP and early stage
- **Cost-Effective**: Predictable pricing for startups ($5/month base + usage)
- **PostgreSQL Included**: Managed database with automatic backups
- **Redis Included**: Built-in Redis for caching and queues
- **GitHub Integration**: Automatic deployments on push
- **Preview Environments**: PR-based preview deployments for testing
- **Vertical Scaling**: Easy resource scaling as traffic grows

#### Migration Path to AWS:
As Logistack scales beyond 10,000 users, migration to AWS provides:
- **ECS Fargate**: Containerized backend deployment
- **RDS PostgreSQL**: Managed database with read replicas
- **ElastiCache Redis**: Managed Redis cluster
- **S3**: Document storage (BOLs, insurance certs, invoices)
- **CloudFront**: CDN for frontend assets
- **Route 53**: DNS management
- **Application Load Balancer**: Traffic distribution

#### Frontend Deployment:
- **Vercel**: Deploy Next.js frontend for optimal performance
  - Edge network for low latency globally
  - Automatic HTTPS and DDoS protection
  - Serverless functions for API routes
  - Preview deployments per pull request

---

## 6. Architecture Pattern

### Choice: **Monorepo with Separate Services (Modular Monolith)**

#### Repository Structure:
```
logistack/
├── apps/
│   ├── web/                 # Next.js frontend (Vercel)
│   ├── api/                 # Fastify backend (Railway/AWS)
│   └── mobile/              # React Native app (future)
├── packages/
│   ├── db/                  # Database schema, migrations, Drizzle ORM
│   ├── shared/              # Shared types, Zod schemas, utilities
│   ├── auth/                # Authentication logic
│   └── ui/                  # Shared UI components (Shadcn/ui)
├── migrations/              # PostgreSQL migrations
├── docs/                    # Documentation
└── package.json             # Root workspace config
```

#### Package Manager: **pnpm**
- Efficient disk space usage with content-addressable storage
- Fast installations with parallel execution
- Native workspace support for monorepo
- Strict dependency management prevents phantom dependencies

#### Rationale:
- **Code Sharing**: Share TypeScript types, validation schemas, and utilities between frontend and backend
- **Atomic Changes**: Update API and client in single PR with type safety
- **Simplified Dependency Management**: Single version of shared dependencies
- **Independent Deployment**: Each app can deploy independently despite shared codebase
- **Future Mobile App**: Easy to add React Native app sharing business logic
- **Gradual Service Extraction**: Can extract microservices later without full rewrite

---

## 7. API Architecture

### Choice: **REST API with WebSocket for Real-Time Features**

#### REST API:
- **Resource-Based**: Standard REST patterns for CRUD operations
- **Versioning**: URL-based versioning (/api/v1/) for backward compatibility
- **Response Format**: Consistent JSON envelope with data, errors, metadata

```typescript
{
  "data": { /* resource */ },
  "meta": {
    "timestamp": "2026-02-15T10:30:00Z",
    "version": "v1"
  },
  "errors": []
}
```

#### Key Endpoints:
- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/users/*` - User management
- `/api/v1/loads/*` - Load posting and search
- `/api/v1/shipments/*` - Shipment tracking
- `/api/v1/bookings/*` - Booking management
- `/api/v1/invoices/*` - Invoicing
- `/api/v1/tracking/*` - GPS location updates

#### WebSocket:
- **Real-Time Tracking**: Live GPS updates for active shipments
- **Notifications**: Instant load availability alerts
- **Chat**: In-app messaging between truckers and businesses

#### Why Not GraphQL:
- REST is simpler for the team and has lower learning curve
- No need for flexible querying - use cases are well-defined
- REST tooling and caching (HTTP) is more mature
- Can add GraphQL layer later if needed for mobile apps

---

## 8. Data Flow Architecture

### Request Flow:
```
┌─────────────┐
│   Client    │
│  (Next.js)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Vercel    │
│   (CDN)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Fastify   │◄────►│  PostgreSQL  │
│   Backend   │      │   (Primary)  │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐
│    Redis    │
│  (Cache)    │
└─────────────┘
```

### Real-Time Flow:
```
┌─────────────┐
│   Trucker   │
│   Mobile    │
└──────┬──────┘
       │ WebSocket
       ▼
┌─────────────┐      ┌──────────────┐
│  WebSocket  │      │     Redis    │
│   Server    │◄────►│   (Pub/Sub)  │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐
│  Business   │
│  Dashboard  │
└─────────────┘
```

---

## 9. Security Architecture

### API Security:
- **JWT Authentication**: All protected endpoints require valid JWT
- **Rate Limiting**: Redis-backed rate limiter (100 req/min per IP)
- **CORS**: Strict origin whitelist
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: React automatic escaping + CSP headers

### Data Security:
- **Encryption at Rest**: PostgreSQL encryption, S3 encryption
- **Encryption in Transit**: TLS 1.3 for all connections
- **Password Security**: bcrypt with salt rounds 12
- **Sensitive Data**: PII encrypted in database
- **Audit Logging**: All financial transactions logged
- **Row-Level Security**: PostgreSQL RLS for multi-tenant isolation

### Compliance:
- **GDPR**: Data deletion endpoints, user data export
- **SOC 2**: Audit logging, encryption, access controls
- **DOT Regulations**: Compliance with trucking industry standards

---

## 10. Monitoring & Observability

### Application Monitoring:
- **Sentry**: Error tracking and performance monitoring
- **Pino Logger**: Structured JSON logging
- **Railway Metrics**: CPU, memory, request metrics

### Future (AWS):
- **CloudWatch**: Logs aggregation and metrics
- **X-Ray**: Distributed tracing
- **Datadog**: APM and infrastructure monitoring

### Database Monitoring:
- **pg_stat_statements**: Query performance analysis
- **Connection pooling**: Monitor pool usage
- **Slow query logging**: Identify performance bottlenecks

---

## 11. Development Workflow

### Version Control:
- **Git**: Source control
- **GitHub**: Code hosting and CI/CD
- **Branch Strategy**: Trunk-based development with feature branches
- **PR Reviews**: Required for all changes

### CI/CD Pipeline:
```
GitHub Push
    ↓
GitHub Actions
    ↓
├─→ Lint (ESLint, Prettier)
├─→ Type Check (TypeScript)
├─→ Unit Tests (Vitest)
├─→ Integration Tests
└─→ Build
    ↓
Deploy to Railway (Backend)
Deploy to Vercel (Frontend)
```

### Testing Strategy:
- **Unit Tests**: Vitest for business logic
- **Integration Tests**: API endpoint testing with test database
- **E2E Tests**: Playwright for critical user flows (future)
- **Load Testing**: k6 for performance testing (future)

---

## 12. Scalability Considerations

### Horizontal Scaling:
- Stateless backend enables multiple instances
- Redis for session sharing across instances
- Database read replicas for read-heavy operations

### Vertical Scaling:
- Railway allows easy resource upgrades
- PostgreSQL connection pooling (PgBouncer)

### Caching Strategy:
- **Redis Cache**: Frequently accessed data (user profiles, active loads)
- **CDN Cache**: Static assets and frontend
- **Database Cache**: Query result caching

### Background Jobs:
- **Bull Queue**: Asynchronous processing
  - Email notifications
  - Invoice generation
  - Report generation
  - Data exports

---

## 13. Future Enhancements

### Phase 2:
- React Native mobile app for truckers
- Advanced analytics dashboard
- Machine learning for route optimization
- Automated load matching algorithms

### Phase 3:
- Multi-region deployment for global expansion
- Microservices extraction (payment processing, notification service)
- GraphQL API for mobile apps
- IoT integration for truck telemetry

### Phase 4:
- Blockchain for load verification and smart contracts
- AI-powered demand forecasting
- White-label solution for enterprise clients

---

## 14. Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 + React 18 | SSR, performance, developer experience |
| **Backend** | Node.js + Fastify | Performance, TypeScript, WebSocket support |
| **Database** | PostgreSQL 15 | Relational model, JSONB, PostGIS |
| **Cache** | Redis | Session storage, real-time data, job queue |
| **Auth** | JWT + Refresh Tokens | Stateless, mobile-friendly, custom flows |
| **Deployment** | Railway + Vercel | Cost-effective, rapid deployment |
| **Architecture** | Monorepo (pnpm workspaces) | Code sharing, atomic changes |
| **API** | REST + WebSocket | Simple, well-understood, real-time capable |
| **ORM** | Drizzle ORM | Type-safe, lightweight, PostgreSQL-first |
| **Validation** | Zod | Runtime validation, shared schemas |
| **State Management** | TanStack Query + Zustand | Server state + client state |
| **Styling** | Tailwind CSS | Rapid development, consistency |
| **Components** | Shadcn/ui + Radix | Accessible, customizable |
| **Maps** | Mapbox GL JS | Route visualization, geolocation |
| **Testing** | Vitest + Playwright | Fast unit tests, reliable E2E |
| **Monitoring** | Sentry + Railway Metrics | Error tracking, performance |
| **CI/CD** | GitHub Actions | Automated testing and deployment |

---

## 15. Key Design Decisions

### Why Custom Auth Instead of Auth0/Supabase?
- No per-user costs as we scale
- Full control over trucking-specific verification (MC/DOT)
- Custom business logic for carrier verification
- No vendor lock-in

### Why Fastify Over Express?
- 2-3x faster performance
- Built-in schema validation
- Better TypeScript support
- Modern plugin architecture

### Why Monorepo Over Separate Repos?
- Shared types and validation between frontend/backend
- Atomic changes across full stack
- Simplified dependency management
- Easier refactoring

### Why Railway Over AWS Initially?
- Faster time to market
- Lower operational complexity
- Cost-effective for MVP
- Easy migration path to AWS later

### Why PostgreSQL Over MongoDB?
- Logistics data is highly relational
- ACID compliance for bookings and payments
- Better query capabilities for complex joins
- PostGIS for geospatial queries

---

## Conclusion

This architecture is designed to support Logistack's growth from MVP to enterprise-scale logistics platform. The technology choices prioritize:

1. **Developer Velocity**: Modern tooling and frameworks for rapid development
2. **Type Safety**: End-to-end TypeScript for fewer bugs
3. **Performance**: Fast frameworks and efficient caching
4. **Scalability**: Stateless architecture ready for horizontal scaling
5. **Cost Efficiency**: Open-source tools and affordable hosting for early stages
6. **Flexibility**: Migration paths to more robust infrastructure as needed

The architecture supports the core logistics workflows while maintaining the flexibility to adapt to changing business requirements and scale with user growth.
