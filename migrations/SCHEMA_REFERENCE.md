# Users Schema Quick Reference

## Table: `users`

### Column Reference

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | No | AUTO | Primary key |
| `user_type` | user_type_enum | No | - | User type: 'trucker' or 'business' |
| `email` | VARCHAR(255) | No | - | Unique email address |
| `password_hash` | VARCHAR(255) | No | - | Bcrypt password hash |
| `phone` | VARCHAR(20) | Yes | NULL | Contact phone number |
| `company_name` | VARCHAR(255) | Yes | NULL | Business name (for businesses) |
| `mc_number` | VARCHAR(50) | Yes | NULL | Motor Carrier number |
| `dot_number` | VARCHAR(50) | Yes | NULL | DOT number |
| `insurance_info` | JSONB | Yes | NULL | Insurance details as JSON |
| `profile_data` | JSONB | No | '{}' | Additional profile information |
| `email_verified` | BOOLEAN | No | FALSE | Email verification status |
| `reset_token` | VARCHAR(255) | Yes | NULL | Password reset token (hashed) |
| `reset_token_expiry` | TIMESTAMP WITH TIME ZONE | Yes | NULL | Reset token expiration time |
| `created_at` | TIMESTAMP WITH TIME ZONE | No | CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No | CURRENT_TIMESTAMP | Last update time |

### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `users_pkey` | id | BTREE | Primary key |
| `users_email_key` | email | BTREE | Unique constraint |
| `idx_users_email` | email | BTREE | Fast email lookups |
| `idx_users_user_type` | user_type | BTREE | Filter by user type |
| `idx_users_mc_number` | mc_number | BTREE (partial) | MC number lookups (excludes NULL) |
| `idx_users_reset_token` | reset_token | BTREE (partial) | Reset token lookups (excludes NULL) |
| `idx_users_created_at` | created_at | BTREE | Sort by registration date |
| `idx_users_profile_data` | profile_data | GIN | JSONB queries |

### Constraints

- **email_format**: Validates email format using regex
- **mc_number_format**: Validates MC number format (alphanumeric with hyphens)
- **dot_number_format**: Validates DOT number format (numeric only)
- **unique email**: Prevents duplicate email addresses
- **NOT NULL**: user_type, email, password_hash, profile_data, timestamps

### Enums

**user_type_enum**: `'trucker'`, `'business'`

### Triggers

- **update_users_updated_at**: Automatically updates `updated_at` timestamp on row updates

## Common Queries

### Authentication

```sql
-- Login: Find user by email
SELECT id, email, password_hash, user_type
FROM users
WHERE email = $1;
```

### User Management

```sql
-- Get user profile
SELECT id, user_type, email, phone, company_name, mc_number, dot_number,
       insurance_info, profile_data, created_at, updated_at
FROM users
WHERE id = $1;

-- Update user profile
UPDATE users
SET phone = $1, profile_data = $2
WHERE id = $3;

-- Search businesses by MC number
SELECT id, email, company_name, mc_number, dot_number
FROM users
WHERE user_type = 'business' AND mc_number = $1;
```

### Advanced Queries

```sql
-- Find truckers with specific license class
SELECT id, email, profile_data
FROM users
WHERE user_type = 'trucker'
  AND profile_data @> '{"license_class": "CDL-A"}';

-- Find available truckers with experience
SELECT id, email, profile_data->>'years_experience' as experience
FROM users
WHERE user_type = 'trucker'
  AND profile_data @> '{"availability_status": "available"}'
  AND CAST(profile_data->>'years_experience' AS INTEGER) >= 5;

-- Find businesses with expiring insurance (within 30 days)
SELECT id, email, company_name,
       insurance_info->>'expiry_date' as expiry_date
FROM users
WHERE user_type = 'business'
  AND insurance_info IS NOT NULL
  AND (insurance_info->>'expiry_date')::date <= CURRENT_DATE + INTERVAL '30 days';

-- Search by company name (case-insensitive)
SELECT id, email, company_name, mc_number
FROM users
WHERE user_type = 'business'
  AND company_name ILIKE '%' || $1 || '%';
```

## Best Practices

### Security

1. **Password Hashing**: Always use bcrypt with salt rounds >= 10
   ```javascript
   const bcrypt = require('bcrypt');
   const hash = await bcrypt.hash(password, 10);
   ```

2. **Parameterized Queries**: Always use parameterized queries to prevent SQL injection
   ```javascript
   // Good
   db.query('SELECT * FROM users WHERE email = $1', [email]);

   // Bad
   db.query(`SELECT * FROM users WHERE email = '${email}'`);
   ```

3. **Rate Limiting**: Implement rate limiting on authentication endpoints

### Data Validation

1. **Email**: Already validated by database constraint, but validate at application level too
2. **MC/DOT Numbers**: Format validated by database, verify existence with FMCSA if needed
3. **Phone Numbers**: Consider using a library like `libphonenumber-js` for validation
4. **JSONB Fields**: Validate structure at application level before inserting

### Performance

1. **Index Usage**: Ensure queries use appropriate indexes
   ```sql
   EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
   ```

2. **JSONB Queries**: Use containment operators for better performance
   - Use `@>` for containment checks
   - Use `->` and `->>` for field access
   - Create additional GIN indexes on specific JSONB paths if needed

3. **Pagination**: Always use LIMIT and OFFSET for large result sets
   ```sql
   SELECT * FROM users
   WHERE user_type = 'trucker'
   ORDER BY created_at DESC
   LIMIT 20 OFFSET 0;
   ```

### Data Integrity

1. **profile_data Structure**: Document expected JSON schema
   ```javascript
   // Trucker profile_data schema
   {
     license_class: string,
     years_experience: number,
     specializations: string[],
     preferred_routes: string[],
     availability_status: string
   }

   // Business profile_data schema
   {
     business_type: string,
     years_in_business: number,
     fleet_size?: number,
     service_areas: string[],
     specializations: string[],
     verified: boolean
   }
   ```

2. **insurance_info Structure**: Standardize format
   ```javascript
   {
     provider: string,
     policy_number: string,
     coverage_amount: number,
     expiry_date: string (ISO 8601),
     cargo_coverage: number
   }
   ```

## Integration Examples

### Node.js with pg

```javascript
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool();

// Create user
async function createUser(userData) {
  const passwordHash = await bcrypt.hash(userData.password, 10);

  const result = await pool.query(
    `INSERT INTO users (user_type, email, password_hash, phone, profile_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, user_type, created_at`,
    [userData.userType, userData.email, passwordHash, userData.phone, userData.profileData]
  );

  return result.rows[0];
}

// Authenticate user
async function authenticateUser(email, password) {
  const result = await pool.query(
    'SELECT id, email, password_hash, user_type FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  // Don't return password_hash
  delete user.password_hash;
  return user;
}
```

### Python with psycopg2

```python
import psycopg2
from psycopg2.extras import Json
import bcrypt

# Create user
def create_user(conn, user_data):
    password_hash = bcrypt.hashpw(
        user_data['password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO users (user_type, email, password_hash, phone, profile_data)
               VALUES (%s, %s, %s, %s, %s)
               RETURNING id, email, user_type, created_at""",
            (user_data['user_type'], user_data['email'], password_hash,
             user_data.get('phone'), Json(user_data.get('profile_data', {})))
        )
        return cur.fetchone()

# Authenticate user
def authenticate_user(conn, email, password):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, email, password_hash, user_type FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()

        if not user:
            return None

        if bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            return {'id': user[0], 'email': user[1], 'user_type': user[3]}

        return None
```

## Testing Checklist

- [ ] Email uniqueness constraint works
- [ ] Email format validation works
- [ ] MC number format validation works
- [ ] DOT number format validation works
- [ ] Password hashing is implemented
- [ ] Timestamps auto-populate on insert
- [ ] `updated_at` auto-updates on row update
- [ ] Indexes are being used (check with EXPLAIN ANALYZE)
- [ ] JSONB queries work correctly
- [ ] User authentication flow works
- [ ] Rate limiting is implemented
- [ ] Error handling for constraint violations
