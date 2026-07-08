#!/usr/bin/env node

/**
 * Command Validation Script
 * Runs on each user prompt to validate commands against security rules
 */

const fs = require('fs');
const path = require('path');

// Get plugin root directory
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;

// Load security state
const securityStatePath = path.join(PLUGIN_ROOT, '.security-state.json');
let securityState = { blockedPatterns: [], allowedPatterns: [], confirmationRequired: [] };

try {
  if (fs.existsSync(securityStatePath)) {
    const stateContent = fs.readFileSync(securityStatePath, 'utf8');
    securityState = JSON.parse(stateContent);
  }
} catch (error) {
  // If state doesn't exist, load from settings
  const settingsPath = path.join(PLUGIN_ROOT, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsContent);
    securityState.blockedPatterns = settings.settings?.security?.blocked_patterns || [];
    securityState.allowedPatterns = settings.settings?.security?.allowed_patterns || [];
    securityState.confirmationRequired = settings.settings?.security?.confirmation_required || [];
  }
}

// Get user prompt from environment or stdin
const userPrompt = process.env.USER_PROMPT || process.argv[2] || '';

if (!userPrompt) {
  // No prompt to validate, exit silently
  process.exit(0);
}

/**
 * Check if text matches any pattern in the pattern list
 */
function matchesPattern(text, patterns) {
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(text)) {
        return { matched: true, pattern: pattern };
      }
    } catch (error) {
      // Invalid regex, skip
    }
  }
  return { matched: false, pattern: null };
}

/**
 * Check if text matches any allowed pattern
 */
function isAllowed(text) {
  const result = matchesPattern(text, securityState.allowedPatterns);
  return result.matched;
}

/**
 * Check if text matches any blocked pattern
 */
function isBlocked(text) {
  return matchesPattern(text, securityState.blockedPatterns);
}

/**
 * Check if text requires confirmation
 */
function requiresConfirmation(text) {
  return matchesPattern(text, securityState.confirmationRequired);
}

/**
 * Get security message for blocked operation
 */
function getBlockMessage(matchedPattern) {
  const messages = {
    '\\.env$': '🚫 ACCESS DENIED: .env files contain sensitive credentials and are protected',
    '\\.pem$': '🚫 ACCESS DENIED: PEM files contain private keys and are protected',
    '\\.key$': '🚫 ACCESS DENIED: Key files contain sensitive cryptographic material',
    '\\.crt$': '🚫 ACCESS DENIED: Certificate files are protected',
    'id_rsa': '🚫 ACCESS DENIED: SSH private keys are protected',
    'id_ed25519': '🚫 ACCESS DENIED: SSH private keys are protected',
    'sudo': '🚫 COMMAND BLOCKED: sudo commands require elevated privileges and can modify system state',
    'rm -rf': '🚫 COMMAND BLOCKED: rm -rf is destructive and can cause irreversible data loss',
    'rm -r /': '🚫 COMMAND BLOCKED: Recursive deletion of root directory is extremely dangerous',
    'dd if=': '🚫 COMMAND BLOCKED: dd commands can destroy data and filesystems',
    'git push (main|master)': '🚫 COMMAND BLOCKED: Pushing to main/master branch requires explicit approval',
    'DROP DATABASE': '🚫 COMMAND BLOCKED: DROP DATABASE is destructive and requires explicit override',
    'DROP TABLE': '🚫 COMMAND BLOCKED: DROP TABLE is destructive and requires explicit override',
    'TRUNCATE': '🚫 COMMAND BLOCKED: TRUNCATE is destructive and requires explicit override'
  };
  
  for (const [pattern, message] of Object.entries(messages)) {
    try {
      if (new RegExp(pattern, 'i').test(matchedPattern)) {
        return message;
      }
    } catch (error) {
      // Invalid regex, skip
    }
  }
  
  return `🚫 OPERATION BLOCKED: Matches blocked pattern "${matchedPattern}"`;
}

/**
 * Get confirmation message for operation requiring confirmation
 */
function getConfirmationMessage(matchedPattern) {
  const messages = {
    'git push': '⚠️  CONFIRMATION REQUIRED: git push will modify remote repository',
    'rm -r': '⚠️  CONFIRMATION REQUIRED: Recursive deletion can cause data loss',
    'DELETE': '⚠️  CONFIRMATION REQUIRED: DELETE operations can remove data permanently',
    'UPDATE': '⚠️  CONFIRMATION REQUIRED: UPDATE operations modify data',
    'ALTER TABLE': '⚠️  CONFIRMATION REQUIRED: ALTER TABLE changes schema structure',
    'chmod': '⚠️  CONFIRMATION REQUIRED: chmod changes file permissions',
    'chown': '⚠️  CONFIRMATION REQUIRED: chown changes file ownership'
  };
  
  for (const [pattern, message] of Object.entries(messages)) {
    try {
      if (new RegExp(pattern, 'i').test(matchedPattern)) {
        return message;
      }
    } catch (error) {
      // Invalid regex, skip
    }
  }
  
  return `⚠️  CONFIRMATION REQUIRED: Matches pattern "${matchedPattern}"`;
}

// Perform validation
const blocked = isBlocked(userPrompt);
const allowed = isAllowed(userPrompt);
const confirmation = requiresConfirmation(userPrompt);

if (blocked.matched) {
  console.log('');
  console.log(getBlockMessage(blocked.pattern));
  console.log('');
  console.log('To override this block, explicitly state:');
  console.log('"I confirm I want to execute this operation despite security warning"');
  console.log('');
  process.exit(1); // Exit with error code to block the operation
} else if (confirmation.matched && !allowed) {
  console.log('');
  console.log(getConfirmationMessage(confirmation.pattern));
  console.log('');
  console.log('To proceed, include confirmation in your request:');
  console.log('"I confirm I want to execute this operation"');
  console.log('');
  // Don't exit, just warn - let the AI decide
  process.exit(0);
}

// If not blocked and doesn't require confirmation, allow the operation
process.exit(0);
