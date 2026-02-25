# Database Migrations

This directory contains SQL migration files for the LogiStack application database.

## Migration Files

### 001_create_users_and_auth.sql

Creates the users table and authentication schema with support for both trucker and business user types.

**Features:**
- User type enum (`trucker`, `business`)
- Core fields: email, password_hash, phone
- Business-specific fields: company_name, mc_number, dot_number, insurance_info
- Flexible profile_data JSONB field for additional information
- Automatic timestamp management (created_at, updated_at)
- Optimized indexes on email, user_type, and mc_number
- Email format validation
- MC and DOT number format validation
- GIN index on profile_data for efficient JSONB queries

**Schema:**
```sql
users (
    id SERIAL PRIMARY KEY,
    user_type user_type_enum NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company_name VARCHAR(255),
    mc_number VARCHAR(50),
    dot_number VARCHAR(50),
    insurance_info JSONB,
    profile_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

**Indexes:**
- `idx_users_email` - Fast email lookups for authentication
- `idx_users_user_type` - Filter by user type
- `idx_users_mc_number` - Partial index for MC number lookups (NULL values excluded)
- `idx_users_created_at` - Sort by registration date
- `idx_users_profile_data` - GIN index for JSONB queries

## Running Migrations

### PostgreSQL

**Apply migration:**
```bash
psql -U username -d database_name -f migrations/001_create_users_and_auth.sql
```

**Rollback migration:**
```bash
psql -U username -d database_name -f migrations/001_create_users_and_auth_down.sql
```

### Using a Migration Tool

If using a migration tool like `node-pg-migrate`, `knex`, or `flyway`, copy the SQL content into the appropriate migration format for your tool.

## Example Usage

### Insert a trucker user:
```sql
INSERT INTO users (user_type, email, password_hash, phone, profile_data)
VALUES (
    'trucker',
    'john.doe@example.com',
    '$2b$10$...',  -- bcrypt hash
    '+1234567890',
    '{"license_class": "CDL-A", "years_experience": 5}'::jsonb
);
```

### Insert a business user:
```sql
INSERT INTO users (
    user_type, email, password_hash, phone,
    company_name, mc_number, dot_number, insurance_info
)
VALUES (
    'business',
    'contact@transportco.com',
    '$2b$10$...',  -- bcrypt hash
    '+1234567890',
    'TransportCo LLC',
    'MC-123456',
    '1234567',
    '{"provider": "InsureCo", "policy_number": "POL-789", "expiry": "2027-12-31"}'::jsonb
);
```

### Query examples:
```sql
-- Find user by email
SELECT * FROM users WHERE email = 'john.doe@example.com';

-- Find all business users
SELECT * FROM users WHERE user_type = 'business';

-- Find business by MC number
SELECT * FROM users WHERE mc_number = 'MC-123456';

-- Search profile data
SELECT * FROM users WHERE profile_data @> '{"license_class": "CDL-A"}';
```

## Security Notes

1. **Password Storage:** Always hash passwords using bcrypt, argon2, or similar before storing in `password_hash`
2. **Email Validation:** The table enforces basic email format validation via CHECK constraint
3. **Sensitive Data:** Consider encrypting `insurance_info` and sensitive fields in `profile_data`
4. **Rate Limiting:** Implement rate limiting on authentication attempts at the application level
5. **Session Management:** This schema doesn't include session storage - consider using Redis or a separate sessions table

## Future Enhancements

Consider adding these in future migrations:
- Email verification status and tokens
- Password reset tokens
- Two-factor authentication fields
- Account status (active, suspended, deleted)
- Last login timestamp
- Failed login attempt tracking
- User preferences table
- User roles and permissions table
