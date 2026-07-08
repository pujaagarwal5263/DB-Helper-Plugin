#!/usr/bin/env node

/**
 * Pre-Tool Use Check Script
 * Runs before any tool is used to inject query generation principles
 */

const fs = require('fs');
const path = require('path');

// Get plugin root directory
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;

// Load the generate-query skill
const generateQueryPath = path.join(PLUGIN_ROOT, 'skills/generate-query/generate-query.md');
let generateQueryPrinciples = '';

try {
  if (fs.existsSync(generateQueryPath)) {
    generateQueryPrinciples = fs.readFileSync(generateQueryPath, 'utf8');
  }
} catch (error) {
  // Skill file not found, use hardcoded principles
  generateQueryPrinciples = `
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
`;
}

// Get tool name and context from environment
const toolName = process.env.TOOL_NAME || process.argv[2] || '';
const toolArgs = process.env.TOOL_ARGS || process.argv[3] || '';

// Check if this is a query-related operation
const queryRelatedTools = [
  'write_to_file',
  'edit',
  'multi_edit',
  'read_file',
  'grep',
  'search'
];

const queryKeywords = [
  'sql',
  'query',
  'select',
  'insert',
  'update',
  'delete',
  'database',
  'table',
  'join',
  'where',
  'index'
];

// Determine if we should inject query principles
let shouldInjectPrinciples = false;

// Check if tool is query-related
if (queryRelatedTools.includes(toolName.toLowerCase())) {
  shouldInjectPrinciples = true;
}

// Check if context contains query keywords
const lowerArgs = toolArgs.toLowerCase();
for (const keyword of queryKeywords) {
  if (lowerArgs.includes(keyword)) {
    shouldInjectPrinciples = true;
    break;
  }
}

// Inject principles if needed
if (shouldInjectPrinciples) {
  console.log('');
  console.log('🔧 DB-HELPER QUERY GENERATION PRINCIPLES ACTIVE');
  console.log('===============================================');
  console.log('');
  console.log('When generating database queries, you MUST follow these principles:');
  console.log('');
  console.log('1. NEVER use SELECT * - always specify exact columns needed');
  console.log('2. Use optimal join types and ordering (most restrictive first)');
  console.log('3. Write sargable WHERE clauses (avoid functions on indexed columns)');
  console.log('4. Always include LIMIT for potentially large result sets');
  console.log('5. Write queries that can utilize existing indexes');
  console.log('6. Prevent N+1 query patterns (use JOINs or IN clauses)');
  console.log('7. Use consistent formatting and meaningful aliases');
  console.log('');
  console.log('These principles ensure query performance, security, and maintainability.');
  console.log('');
}

// Also check for file operations that might be .env files
if (toolArgs.toLowerCase().includes('.env') || 
    toolArgs.toLowerCase().includes('.pem') ||
    toolArgs.toLowerCase().includes('.key')) {
  console.log('');
  console.log('⚠️  SECURITY WARNING: You are attempting to access a sensitive file');
  console.log('.env, .pem, and .key files contain credentials and should not be accessed');
  console.log('');
  console.log('If this is intentional, explicitly state: "I confirm I want to access this sensitive file"');
  console.log('');
}

process.exit(0);
