---
description: Universal principles for generating optimized database queries - ALWAYS follow these when writing queries
---

These are IMMUTABLE PRINCIPLES that must be followed when generating any database query. Users with this plugin installed expect all queries to adhere to these standards.

## Core Query Generation Principles

### 1. Column Selection (MANDATORY)
- NEVER use SELECT * - always specify exact columns needed
- Only select columns that will be used in the application
- Use table aliases for clarity in multi-table queries
- Avoid selecting redundant data from joins

### 2. Join Optimization (MANDATORY)
- Use INNER JOIN when relationship is required
- Use LEFT JOIN only when outer rows must be preserved
- Join tables in order of selectivity (most restrictive first)
- Use explicit JOIN syntax, never implicit joins (WHERE clause joins)
- Consider subqueries vs JOINs based on data size and complexity

### 3. WHERE Clause Requirements (MANDATORY)
- Always include WHERE clauses for filtering (unless full table scan is intentional)
- Use sargable predicates (avoid functions on indexed columns)
- Place most selective conditions first
- Use IN instead of OR for multiple values on same column
- Avoid leading wildcards in LIKE patterns
- Use parameterized queries to prevent SQL injection

### 4. Result Set Management (MANDATORY)
- Always include LIMIT for queries that could return large result sets
- Use OFFSET/LIMIT or cursor-based pagination for large datasets
- Consider adding COUNT queries separately for pagination metadata
- Default to reasonable LIMIT (e.g., 100) unless otherwise specified

### 5. Index Awareness (MANDATORY)
- Write queries that can utilize existing indexes
- Order WHERE conditions to match index composition
- Consider covering indexes for frequently accessed columns
- Avoid operations that prevent index usage (functions, type conversions)

### 6. N+1 Prevention (MANDATORY)
- Never generate queries that require loops to fetch related data
- Use JOINs or IN clauses for fetching related entities
- Use eager loading patterns in ORMs (includes, preloads)
- Batch single-row queries into multi-row queries when possible

### 7. Query Readability (MANDATORY)
- Use consistent formatting and indentation
- Employ CTEs (Common Table Expressions) for complex logic
- Add comments for non-obvious business logic
- Use meaningful table and column aliases
- Break complex queries into logical sections

## Framework-Specific Guidelines

### Raw SQL Queries
- Use prepared statements or parameterized queries
- Format SQL with proper line breaks and indentation
- Include table aliases in all column references
- Use CTEs instead of nested subqueries when clarity improves

### ORM Queries (ActiveRecord, Sequelize, TypeORM, etc.)
- Use explicit select/include for needed relations
- Avoid default eager loading of all relations
- Use scopes for common query patterns
- Leverage ORM-specific optimization methods (e.g., `select`, `joins`, `includes`)

### Query Builders (Knex, Doctrine DBAL, etc.)
- Build queries step-by-step for clarity
- Use chaining methods in logical order
- Add debug comments for complex builder chains
- Validate final SQL before execution

## Performance Guardrails

### Query Complexity Limits
- Avoid more than 5-6 joins in a single query
- Consider breaking complex queries into multiple steps
- Use temporary tables or CTEs for intermediate results
- Monitor query execution time in development

### Data Volume Considerations
- For large datasets (>100K rows), always use pagination
- Consider batch processing for bulk operations
- Use streaming cursors for very large result sets
- Add query timeouts for long-running queries

### Caching Strategy
- Identify cacheable query patterns
- Suggest appropriate cache TTL based on data volatility
- Consider query result caching for expensive operations
- Use materialized views for complex aggregations

## Error Handling & Safety

### SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input into SQL strings
- Validate and sanitize all user inputs
- Use ORM-provided escaping methods

### Transaction Safety
- Wrap related write operations in transactions
- Keep transactions as short as possible
- Use appropriate isolation levels
- Handle deadlocks with retry logic

### Data Integrity
- Include appropriate WHERE clauses in UPDATE/DELETE
- Use transactions for multi-table operations
- Consider soft deletes instead of hard deletes
- Validate foreign key constraints

## Query Generation Checklist

Before finalizing any query, verify:
- [ ] Only required columns are selected
- [ ] Joins are optimal and necessary
- [ ] WHERE clause is sargable and selective
- [ ] LIMIT is set for potentially large results
- [ ] No N+1 query patterns exist
- [ ] Indexes can be utilized effectively
- [ ] Query is readable and well-formatted
- [ ] SQL injection protection is in place
- [ ] Transaction boundaries are appropriate
- [ ] Error handling is considered

## Examples

### Good Query Example
```sql
SELECT u.id, u.name, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name, u.email
ORDER BY order_count DESC
LIMIT 100;
```

### Bad Query Example (violates principles)
```sql
SELECT * 
FROM users, orders 
WHERE users.id = orders.user_id
LIMIT 1000;
```
Violations: SELECT *, implicit join, no WHERE clause, excessive LIMIT

When generating queries, ALWAYS explain which principles you're following and why.
