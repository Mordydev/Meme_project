# Success Kid Platform - Data Model Documentation

This document provides comprehensive documentation of the database schema and entity models used in the Success Kid platform.

## Core Entity Models

### User Entity

The User entity represents registered users of the platform.

**DB Table**: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Unique identifier for the user |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| `display_name` | VARCHAR(255) | NOT NULL | User's displayed name on the platform |
| `auth_provider` | VARCHAR(50) | NOT NULL | Authentication provider (email, google, twitter, github, wallet) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the user was created |
| `last_login` | TIMESTAMP | DEFAULT NOW() | When the user last logged in |
| `status` | VARCHAR(50) | DEFAULT 'active' | User status (active, suspended, deleted) |

**Indexes**:
- `idx_users_email` - For email lookups
- `idx_users_display_name` - For display name searches
- `idx_users_status` - For filtering users by status
- `idx_users_created_at` - For sorting by creation date

**Validation**:
- Email must be valid format
- Display name must be 3-50 characters
- Auth provider must be one of the allowed values
- Status must be one of the allowed values

### Profile Entity

The Profile entity contains additional user profile information.

**DB Table**: `profiles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | VARCHAR(255) | FOREIGN KEY (users.id), PRIMARY KEY | Reference to user |
| `bio` | TEXT | NULL | User's profile bio |
| `avatar_url` | VARCHAR(255) | NULL | URL to user's avatar image |
| `level` | INTEGER | NOT NULL, DEFAULT 1 | User's achieved level |
| `title` | VARCHAR(100) | NULL | User's selected title |
| `social_links` | JSONB | NOT NULL, DEFAULT '{}' | JSON object with social media links |
| `preferences` | JSONB | NOT NULL, DEFAULT '{}' | User preferences settings |

**Indexes**:
- `idx_profiles_user_id` - For joining with users
- `idx_profiles_level` - For level-based queries

**Relationships**:
- One-to-One relationship with User entity

### Content Entity

The Content entity represents user-generated content posted on the platform.

**DB Table**: `content`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the content |
| `user_id` | VARCHAR(255) | FOREIGN KEY (users.id) | Reference to content creator |
| `type` | VARCHAR(20) | NOT NULL | Content type (text, image, link, poll) |
| `content_text` | TEXT | NOT NULL | Text content |
| `media_urls` | JSONB | NULL | Array of media URLs for image posts |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the content was created |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | When the content was last updated |
| `status` | VARCHAR(20) | DEFAULT 'active' | Content status (active, deleted, flagged) |

**Indexes**:
- `idx_content_user_id` - For finding content by user
- `idx_content_created_at` - For chronological ordering
- `idx_content_type` - For filtering by content type
- `idx_content_status` - For filtering by status
- `idx_content_text_search` - GIN index for text search

**Relationships**:
- Many-to-One relationship with User entity
- One-to-Many relationship with Comment entity
- One-to-Many relationship with Reaction entity

### Comment Entity

The Comment entity represents user comments on content.

**DB Table**: `comments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the comment |
| `content_id` | UUID | FOREIGN KEY (content.id), NOT NULL | Reference to content |
| `user_id` | VARCHAR(255) | FOREIGN KEY (users.id), NOT NULL | Reference to comment author |
| `comment_text` | TEXT | NOT NULL | Comment text |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the comment was created |
| `parent_id` | UUID | FOREIGN KEY (comments.id), NULL | Reference to parent comment (for nested comments) |

**Indexes**:
- `idx_comments_content_id` - For finding comments on content
- `idx_comments_user_id` - For finding comments by user
- `idx_comments_parent_id` - For finding child comments

**Relationships**:
- Many-to-One relationship with Content entity
- Many-to-One relationship with User entity
- Self-referential for comment threading

### User Points Entity

The User Points entity tracks points awarded to users for platform activities.

**DB Table**: `user_points`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the transaction |
| `user_id` | VARCHAR(255) | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `amount` | INTEGER | NOT NULL | Point amount (positive for earning, negative for spending) |
| `source` | VARCHAR(50) | NOT NULL | Source of points (content_creation, comment, daily_login, etc.) |
| `reference_id` | VARCHAR(255) | NULL | Optional reference ID (e.g., content ID, achievement ID) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the points were awarded |
| `description` | TEXT | NULL | Description of the points transaction |

**Indexes**:
- `idx_points_user_id` - For finding points by user
- `idx_points_created_at` - For chronological ordering
- `idx_points_source` - For filtering by source

**Constraints**:
- `amount` must not be zero

**Relationships**:
- Many-to-One relationship with User entity

### Achievement Entity

The Achievement entity represents platform achievements users can unlock.

**DB Table**: `achievements`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the achievement |
| `name` | VARCHAR(100) | NOT NULL | Achievement name |
| `description` | TEXT | NOT NULL | Achievement description |
| `image_url` | VARCHAR(255) | NULL | Achievement badge image URL |
| `points_reward` | INTEGER | NOT NULL, DEFAULT 0 | Points awarded for unlocking |
| `difficulty` | VARCHAR(20) | NOT NULL | Difficulty level (common, uncommon, rare, epic) |
| `requirements` | JSONB | NOT NULL | Requirements to unlock the achievement |

**Indexes**:
- `idx_achievements_difficulty` - For filtering by difficulty

### User Achievement Entity

The User Achievement entity tracks which achievements users have unlocked.

**DB Table**: `user_achievements`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | VARCHAR(255) | FOREIGN KEY (users.id), PRIMARY KEY COMPOSITE | Reference to user |
| `achievement_id` | UUID | FOREIGN KEY (achievements.id), PRIMARY KEY COMPOSITE | Reference to achievement |
| `unlocked_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When the achievement was unlocked |
| `progress` | JSONB | NOT NULL, DEFAULT '{}' | Progress towards achievement completion |

**Indexes**:
- `idx_user_achievements_user_id` - For finding achievements by user
- `idx_user_achievements_unlocked_at` - For chronological ordering

**Relationships**:
- Many-to-One relationship with User entity
- Many-to-One relationship with Achievement entity

### Wallet Connection Entity

The Wallet Connection entity links users to their cryptocurrency wallets.

**DB Table**: `wallet_connections`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the connection |
| `user_id` | VARCHAR(255) | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `wallet_address` | VARCHAR(255) | NOT NULL | Blockchain wallet address |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT false | Whether the wallet has been verified |
| `connected_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When the wallet was connected |
| `last_verified_at` | TIMESTAMP | NULL | When the wallet was last verified |

**Indexes**:
- `idx_wallet_user_id` - For finding wallets by user
- `idx_wallet_address` - For finding users by wallet
- `idx_wallet_is_verified` - For filtering verified wallets

**Relationships**:
- Many-to-One relationship with User entity

### Referral Entity

The Referral entity tracks user referrals.

**DB Table**: `referrals`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the referral |
| `referrer_id` | VARCHAR(255) | FOREIGN KEY (users.id), NOT NULL | User who referred someone |
| `referred_id` | VARCHAR(255) | FOREIGN KEY (users.id), NOT NULL | User who was referred |
| `code` | VARCHAR(50) | NOT NULL | Referral code used |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When the referral occurred |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Referral status (pending, completed, rewarded) |

**Indexes**:
- `idx_referrals_referrer_id` - For finding referrals by referrer
- `idx_referrals_referred_id` - For finding the referrer of a user
- `idx_referrals_code` - For finding referrals by code
- `idx_referrals_status` - For filtering by status

**Relationships**:
- Many-to-One relationship with User entity (referrer)
- Many-to-One relationship with User entity (referred)

### Reaction Entity

The Reaction entity represents user reactions to content.

**DB Table**: `reactions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the reaction |
| `user_id` | VARCHAR(255) | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `content_id` | UUID | FOREIGN KEY (content.id), NOT NULL | Reference to content |
| `type` | VARCHAR(20) | NOT NULL | Reaction type (upvote, like, etc.) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When the reaction was created |

**Indexes**:
- `idx_reactions_user_id` - For finding reactions by user
- `idx_reactions_content_id` - For finding reactions on content
- `idx_reactions_type` - For filtering by reaction type

**Relationships**:
- Many-to-One relationship with User entity
- Many-to-One relationship with Content entity

## Entity Relationships Diagram

```
+--------+       +---------+       +----------+
| User   |<----->| Profile |       | Wallet   |
+--------+       +---------+       +----------+
    ^                                 ^
    |                                 |
    v                                 |
+----------+                          |
| Content  |<---------+               |
+----------+          |               |
    ^                 |               |
    |                 v               |
    v                 |               |
+---------+        +----------+       |
| Comment |        | Reaction |-------+
+---------+        +----------+
    ^
    |
    v
+--------------+    +-----------------+    +------------+
| Achievement  |<-->| UserAchievement |<---| UserPoints |
+--------------+    +-----------------+    +------------+
                          ^
                          |
                          v
                    +----------+
                    | Referral |
                    +----------+
```

## Database Design Considerations

### Performance Optimizations

1. **Indexing Strategy**:
   - Indexes are created on columns frequently used in WHERE, JOIN, and ORDER BY clauses
   - Composite indexes for common query patterns
   - Partial indexes for active content to optimize common queries

2. **Query Optimization**:
   - Keyset pagination (using ID and timestamp) for efficient pagination
   - Denormalization where appropriate for query performance
   - Optimized joins with proper index usage

3. **Data Access Patterns**:
   - Repository pattern for clean data access abstraction
   - Efficient query building with parameterized queries
   - Transaction management for data consistency

### Data Integrity

1. **Constraints**:
   - Foreign key constraints to maintain referential integrity
   - Check constraints for data validation
   - Unique constraints where appropriate

2. **Validation**:
   - Zod schemas for request validation
   - TypeScript types for compile-time type safety
   - Business rule validation in services layer

### Migrations

Database migrations are managed using a version-controlled migration system:

1. Each migration has a unique ID and name
2. Migrations are applied in order
3. Each migration supports both up (apply) and down (rollback) operations
4. Migrations are tracked in a migrations table to manage the current database state

## Transaction Management

Database transactions are used to ensure data consistency for operations affecting multiple entities:

1. **Automatic Transactions**: The repository layer manages transactions for complex operations
2. **Manual Transactions**: Service layer explicitly manages transactions for cross-entity operations
3. **Isolation Levels**: Default READ COMMITTED isolation level for most operations
4. **Error Handling**: Automatic rollback on errors with consistent error reporting

## Best Practices

1. **Naming Conventions**:
   - Snake_case for database objects (tables, columns, indexes)
   - Camel case for TypeScript properties
   - Descriptive names that clearly indicate purpose

2. **Data Access**:
   - Always use repositories for data access
   - Never use raw SQL in application code (outside repositories)
   - Use parameterized queries to prevent SQL injection

3. **Database Connection Management**:
   - Connection pooling with appropriate size and timeout settings
   - Proper connection release in all code paths
   - Monitoring of connection pool utilization

4. **Error Handling**:
   - Specific error types for database errors
   - Consistent error logging with appropriate context
   - No exposure of database errors to clients (mapped to application errors)

5. **Performance Monitoring**:
   - Query execution time tracking
   - Slow query logging and analysis
   - Connection pool monitoring
   - Regular performance testing with standard test suites

## Future Considerations

1. **Scaling Strategy**:
   - Potential for read replicas as user base grows
   - Consider sharding for very large datasets
   - Evaluate NoSQL options for specific high-volume data types

2. **Data Retention**:
   - Implement archiving strategy for old data
   - Historical data analytics support
   - GDPR compliance for data deletion requests
