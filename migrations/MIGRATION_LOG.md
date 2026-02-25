# Migration Log

Track the status of database migrations for the LogiStack application.

## Migration Status

| # | Name | Status | Applied Date | Applied By | Notes |
|---|------|--------|--------------|------------|-------|
| 001 | create_users_and_auth | Pending | - | - | Users table with authentication (email verification, password reset) |

## Status Definitions

- **Pending**: Migration created but not yet applied to any environment
- **Applied (Dev)**: Applied to development environment
- **Applied (Staging)**: Applied to staging environment
- **Applied (Production)**: Applied to production environment
- **Rolled Back**: Migration was applied and then rolled back

## Instructions

When applying a migration, update the table above with:
1. Status change
2. Date applied (YYYY-MM-DD)
3. Who applied it
4. Any relevant notes or issues encountered

## Environment Details

### Development
- **Database**: (Add your dev database details)
- **Host**: localhost or dev server
- **Last Migration**: None yet

### Staging
- **Database**: (Add your staging database details)
- **Host**: staging server
- **Last Migration**: None yet

### Production
- **Database**: (Add your production database details)
- **Host**: production server
- **Last Migration**: None yet

## Migration Application Example

```bash
# Development
psql -U dev_user -d logistack_dev -f migrations/001_create_users_and_auth.sql

# Staging
psql -U staging_user -d logistack_staging -f migrations/001_create_users_and_auth.sql

# Production
psql -U prod_user -d logistack_prod -f migrations/001_create_users_and_auth.sql
```

## Rollback Example

```bash
# If you need to rollback
psql -U user -d database -f migrations/001_create_users_and_auth_down.sql
```

## Notes

- Always backup the database before applying migrations in staging/production
- Test migrations in development environment first
- Run validation script after applying migration
- Document any manual changes or data migrations required
