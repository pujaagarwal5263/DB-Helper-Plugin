# DB-Helper Plugin

A comprehensive Claude plugin for database optimization, query assistance, and schema design best practices.

## Overview

DB-Helper provides skills and hooks to ensure high-quality database queries and schema designs. It enforces universal principles for query generation and provides automated quality checks.

## Features

### Skills

- **`/review`** - Review database queries and schema for indexing and optimization opportunities
- **`/suggest`** - Suggest database schema design based on best practices and project requirements
- **`/query-scores`** - Evaluate and score database queries on optimization and best practices
- **`/generate-query`** - Universal principles for generating optimized database queries (always enforced)
- **`/analyze-table`** - Perform deep analysis of a specific database table structure and usage patterns
- **`/migration-plan`** - Generate safe migration scripts for database schema changes
- **`/explain-plan`** - Parse and explain query execution plans to identify performance bottlenecks

### Hooks

Hooks are defined in `claude-codex-hooks.json` and run JavaScript scripts from the `scripts/` directory:

**Security Hooks:**
- **`SessionStart`** - Initialize security rules when Claude session starts (runs `scripts/security-init.js`)
- **`UserPromptSubmit`** - Validate each user prompt for dangerous commands (runs `scripts/validate-command.js`)
- **`PreToolUse`** - Inject query generation principles before tool execution (runs `scripts/pre-tool-check.js`)
- **`PostToolUse`** - Validate tool execution results (runs `scripts/post-tool-check.js`)

**Database Skills (Markdown):**
The database optimization features are implemented as skills that can be invoked directly:
- **`/review`** - Review database queries and schema for indexing and optimization opportunities
- **`/suggest`** - Suggest database schema design based on best practices
- **`/query-scores`** - Evaluate and score database queries on optimization
- **`/generate-query`** - Universal principles for generating optimized queries (automatically enforced via PreToolUse hook)
- **`/analyze-table`** - Perform deep analysis of table structure and usage
- **`/migration-plan`** - Generate safe migration scripts
- **`/explain-plan`** - Parse and explain query execution plans

## Installation

1. Clone this repository to your Claude plugins directory
2. Restart Claude to load the plugin
3. The skills and hooks will be automatically available

## Usage

### Using Skills

Invoke skills directly in your conversations:

```
/review - Review this query for optimization opportunities:
SELECT * FROM users WHERE email LIKE '%@gmail.com';

/suggest - Suggest a schema for an e-commerce application;

/query-scores - Score this query on optimization:
SELECT u.name, COUNT(o.id) as order_count 
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
GROUP BY u.id, u.name;

/analyze-table - Analyze the users table structure and usage;

/migration-plan - Create a migration plan to add a phone column to users table;

/explain-plan - Analyze this execution plan and identify bottlenecks;
```

### Automatic Hook Behavior

**Security Hooks** run automatically via lifecycle events defined in `claude-codex-hooks.json`:
- **SessionStart**: Initializes security rules when you start a Claude session
- **UserPromptSubmit**: Validates each prompt for dangerous commands before execution
- **PreToolUse**: Injects query generation principles before any tool is used (automatically enforces `/generate-query` principles)
- **PostToolUse**: Validates tool execution results and provides feedback

**Database Skills** are invoked manually:
- Use `/review`, `/suggest`, `/query-scores`, etc. to get database assistance
- The `/generate-query` principles are automatically injected via PreToolUse hook when query operations are detected

### Universal Query Generation

The `/generate-query` skill contains immutable principles that are always followed when generating queries:

- **Never use SELECT *** - Always specify exact columns needed
- **Optimal join usage** - Proper join types and ordering
- **Sargable WHERE clauses** - Conditions that can use indexes
- **Result set management** - LIMIT for large datasets
- **Index awareness** - Write queries that can utilize indexes
- **N+1 prevention** - Avoid patterns that cause multiple queries
- **Query readability** - Consistent formatting and structure

## Configuration

Edit `settings.json` to customize plugin behavior:

```json
{
  "settings": {
    "query_quality_threshold": 6.0,
    "strict_mode": false,
    "auto_rewrite_queries": false,
    "verbose_output": true,
    "enable_learning": true,
    "environment": "development",
    "security": {
      "blocked_patterns": [
        "\\.env$",
        "\\.pem$",
        "\\.key$",
        "sudo",
        "rm -rf",
        "git push (main|master)",
        "DROP DATABASE",
        "DROP TABLE"
      ],
      "allowed_patterns": [
        "\\.(js|py|ts|java|go)$",
        "\\.(md|txt|json|yaml)$",
        "package\\.json"
      ],
      "confirmation_required": [
        "git push",
        "rm -r",
        "DELETE",
        "UPDATE",
        "ALTER TABLE"
      ]
    }
  }
}
```

### Settings Explained

**Database Settings:**
- **query_quality_threshold** (default: 6.0) - Minimum acceptable score for generated queries (0-10 scale)
- **strict_mode** (default: false) - Block all principle violations when true
- **auto_rewrite_queries** (default: false) - Automatically fix obvious query issues
- **verbose_output** (default: true) - Provide detailed feedback vs summary
- **enable_learning** (default: true) - Learn from project patterns over time
- **environment** (default: "development") - Current environment (development/staging/production)

**Security Settings:**
- **blocked_patterns** - Regex patterns that are completely blocked (e.g., .env files, sudo commands)
- **allowed_patterns** - Regex patterns that are explicitly allowed (e.g., source code files)
- **confirmation_required** - Patterns that require explicit user confirmation before proceeding

## Compatibility

### Databases Supported

- PostgreSQL
- MySQL
- SQLite
- SQL Server
- Oracle

### Frameworks Supported

- Raw SQL
- ActiveRecord (Ruby on Rails)
- Sequelize (Node.js)
- TypeORM (TypeScript/JavaScript)
- Knex (Node.js)
- Doctrine (PHP)
- SQLAlchemy (Python)
- Prisma (TypeScript/JavaScript)

## Examples

### Query Generation with Automatic Quality Check

```
User: Write a query to get active users with their recent orders

Claude: [Generates query following /generate-query principles]
[Automatically runs /query-scores on generated query]
[Provides scorecard with strengths and improvement suggestions]
```

### Schema Change Validation

```
User: Add a phone number column to the users table

Claude: [Activates /review skill]
[Analyzes impact and provides risk assessment]
[Generates safe migration script]
[Checks for backward compatibility]
```

### Migration Planning

```
User: I need to change the price column from INT to DECIMAL in the products table

Claude: [Activates /migration-plan skill]
[Provides safe two-step migration approach]
[Generates UP and DOWN migration scripts]
[Includes validation queries]
[Warns about application deployment requirements]
```

### Security Block Examples

```
User: Read the .env file to check database configuration

Claude: 🚫 ACCESS DENIED: .env files contain sensitive credentials and are protected

Alternative Actions:
- Use environment variable documentation instead
- Check database configuration in non-sensitive config files
```

```
User: Run sudo apt-get install nginx

Claude: 🚫 COMMAND BLOCKED: sudo commands require elevated privileges

Alternative Actions:
- Use user-level package installation
- Check if nginx is already installed
- Use containerization instead of system-level installation
```

```
User: Push changes to main branch

Claude: ⚠️  CONFIRMATION REQUIRED: git push will modify remote repository

To proceed: "I confirm I want to push to main branch"
To cancel: Push to feature branch instead or create pull request
```

## Best Practices Enforced

### Query Optimization

- Specific column selection instead of SELECT *
- Proper join usage and ordering
- Index-aware query construction
- N+1 query pattern prevention
- Appropriate LIMIT clauses
- Sargable WHERE conditions

### Schema Design

- Proper table normalization
- Appropriate data types
- Foreign key relationships
- Index design principles
- Naming conventions
- Audit trail columns

### Migration Safety

- Backward compatibility
- Zero-downtime migrations
- Rollback procedures
- Pre-migration validation
- Post-migration verification
- Environment-specific rules

### Security Controls

- **File Access Protection** - Blocks access to .env, .pem, .key files and other sensitive files
- **Command Blocking** - Blocks dangerous commands (sudo, rm -rf, dd, etc.)
- **Git Safety** - Blocks push to main/master branches, requires confirmation for force push
- **Database Protection** - Blocks DROP DATABASE/TABLE, DELETE without WHERE
- **Confirmation Required** - High-risk operations require explicit user confirmation
- **Environment-Aware** - Different security rules for dev/staging/production

## Contributing

To extend the plugin:

1. Add new skills to the `skills/` directory (markdown files with YAML frontmatter)
2. Add new security scripts to the `scripts/` directory (JavaScript files)
3. Update `settings.json` with new skill references or security patterns
4. For security hooks, add them to `claude-codex-hooks.json` in the appropriate lifecycle event
5. Hook format follows Claude plugin specification:
   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "matcher": "startup|resume|clear|compact",
           "hooks": [
             {
               "type": "command",
               "command": "exec node \"${CLAUDE_PLUGIN_ROOT}/scripts/your-script.js\"",
               "commandWindows": "if (Get-Command node -ErrorAction SilentlyContinue) { node \"$env:CLAUDE_PLUGIN_ROOT\\scripts\\your-script.js\" }",
               "timeout": 5,
               "statusMessage": "Your status message..."
             }
           ]
         }
       ]
     }
   }
   ```

**Available Lifecycle Events:**
- `SessionStart` - When Claude session starts
- `UserPromptSubmit` - When user submits a prompt
- `PreToolUse` - Before any tool is used
- `PostToolUse` - After tool execution completes
- And more...

## License

This plugin is provided as-is for database optimization assistance.
