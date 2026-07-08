#!/usr/bin/env node

/**
 * Post-Tool Use Check Script
 * Runs after tool execution to validate results and provide feedback
 */

const fs = require('fs');
const path = require('path');

// Get plugin root directory
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;

// Get tool name and result from environment
const toolName = process.env.TOOL_NAME || process.argv[2] || '';
const toolResult = process.env.TOOL_RESULT || process.argv[3] || '';

// Check if this was a query-related operation
const queryKeywords = [
  'sql',
  'query',
  'select',
  'insert',
  'update',
  'delete',
  'database',
  'table'
];

const lowerResult = toolResult.toLowerCase();
const wasQueryOperation = queryKeywords.some(k => lowerResult.includes(k));

// Provide feedback for query operations
if (wasQueryOperation) {
  console.log('');
  console.log('✅ Query operation completed');
  console.log('');
  console.log('Remember to verify:');
  console.log('- Query uses specific columns (not SELECT *)');
  console.log('- WHERE clauses are sargable');
  console.log('- Appropriate LIMIT is set');
  console.log('- Indexes can be utilized');
  console.log('- No N+1 patterns exist');
  console.log('');
}

// Check for potential issues in the result
if (lowerResult.includes('select *')) {
  console.log('');
  console.log('⚠️  WARNING: SELECT * detected in query');
  console.log('Consider specifying exact columns needed for better performance');
  console.log('');
}

if (lowerResult.includes('delete') && !lowerResult.includes('where')) {
  console.log('');
  console.log('⚠️  WARNING: DELETE without WHERE clause detected');
  console.log('This will affect all rows in the table');
  console.log('');
}

if (lowerResult.includes('drop') && (lowerResult.includes('table') || lowerResult.includes('database'))) {
  console.log('');
  console.log('⚠️  WARNING: Destructive DROP operation detected');
  console.log('Ensure this is intentional and you have a backup');
  console.log('');
}

process.exit(0);
