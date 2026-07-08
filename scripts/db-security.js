#!/usr/bin/env node

/**
 * Database Security Validation Script
 * Provides database-specific security checks and validations
 */

const fs = require('fs');
const path = require('path');

// Get plugin root directory
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;

/**
 * Validate SQL query for security issues
 */
function validateSQLQuery(query) {
  const issues = [];
  const warnings = [];

  // Check for destructive operations
  const destructivePatterns = [
    { pattern: /DROP\s+DATABASE/i, message: 'DROP DATABASE - destroys entire database' },
    { pattern: /DROP\s+TABLE/i, message: 'DROP TABLE - destroys table structure and data' },
    { pattern: /TRUNCATE/i, message: 'TRUNCATE - removes all data from table' },
    { pattern: /DELETE\s+FROM\s+\w+\s*$/i, message: 'DELETE without WHERE clause - affects all rows' }
  ];

  for (const { pattern, message } of destructivePatterns) {
    if (pattern.test(query)) {
      issues.push(message);
    }
  }

  // Check for unsafe operations
  const unsafePatterns = [
    { pattern: /DELETE\s+FROM/i, message: 'DELETE operation - ensure WHERE clause is appropriate' },
    { pattern: /UPDATE\s+\w+\s+SET/i, message: 'UPDATE operation - ensure WHERE clause is appropriate' },
    { pattern: /INSERT\s+INTO/i, message: 'INSERT operation - validate data being inserted' },
    { pattern: /ALTER\s+TABLE/i, message: 'ALTER TABLE - changes schema structure' }
  ];

  for (const { pattern, message } of unsafePatterns) {
    if (pattern.test(query)) {
      warnings.push(message);
    }
  }

  // Check for SQL injection risks
  const injectionPatterns = [
    { pattern: /["'].*\$\{.*\}.*["']/i, message: 'Possible SQL injection via string interpolation' },
    { pattern: /["'].*\+.*["']/i, message: 'Possible SQL injection via string concatenation' }
  ];

  for (const { pattern, message } of injectionPatterns) {
    if (pattern.test(query)) {
      issues.push(message);
    }
  }

  // Check for missing WHERE clauses in UPDATE/DELETE
  const updateDeletePattern = /(UPDATE|DELETE)\s+\w+/i;
  const wherePattern = /\bWHERE\b/i;
  const updateDeleteMatch = query.match(updateDeletePattern);
  
  if (updateDeleteMatch && !wherePattern.test(query)) {
    issues.push(`${updateDeleteMatch[1]} without WHERE clause - affects all rows`);
  }

  return { issues, warnings };
}

/**
 * Validate migration script for safety
 */
function validateMigrationScript(script) {
  const issues = [];
  const warnings = [];

  // Check for rollback procedure
  if (!script.toLowerCase().includes('down') && 
      !script.toLowerCase().includes('rollback') &&
      !script.toLowerCase().includes('revert')) {
    warnings.push('Migration script missing rollback procedure');
  }

  // Check for backup mention
  if (!script.toLowerCase().includes('backup') && 
      (script.toLowerCase().includes('drop') || 
       script.toLowerCase().includes('alter') ||
       script.toLowerCase().includes('delete'))) {
    warnings.push('Destructive migration should mention backup strategy');
  }

  // Check for transaction usage
  if (script.toLowerCase().includes('update') || 
      script.toLowerCase().includes('delete') ||
      script.toLowerCase().includes('insert')) {
    if (!script.toLowerCase().includes('begin') && 
        !script.toLowerCase().includes('transaction')) {
      warnings.push('Data modification operations should use transactions');
    }
  }

  return { issues, warnings };
}

/**
 * Validate database connection string for security
 */
function validateConnectionString(connectionString) {
  const issues = [];
  const warnings = [];

  // Check for hardcoded credentials
  if (connectionString.includes('password=') || 
      connectionString.includes(':password@')) {
    issues.push('Connection string contains hardcoded password');
  }

  // Check for unencrypted connections
  if (connectionString.startsWith('mysql://') || 
      connectionString.startsWith('postgresql://')) {
    if (!connectionString.includes('sslmode=')) {
      warnings.push('Connection string should use SSL/TLS encryption');
    }
  }

  // Check for root user
  if (connectionString.includes('user=root') || 
      connectionString.includes('root@')) {
    warnings.push('Using root user for application connections is not recommended');
  }

  return { issues, warnings };
}

// Export functions for use in other scripts
module.exports = {
  validateSQLQuery,
  validateMigrationScript,
  validateConnectionString
};

// If run directly, validate from command line argument
if (require.main === module) {
  const input = process.argv[2] || '';
  const type = process.argv[3] || 'query';

  let result;
  if (type === 'migration') {
    result = validateMigrationScript(input);
  } else if (type === 'connection') {
    result = validateConnectionString(input);
  } else {
    result = validateSQLQuery(input);
  }

  if (result.issues.length > 0) {
    console.log('🚫 SECURITY ISSUES FOUND:');
    result.issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log('');
  }

  if (result.issues.length === 0 && result.warnings.length === 0) {
    console.log('✅ No security issues found');
  }

  process.exit(result.issues.length > 0 ? 1 : 0);
}
