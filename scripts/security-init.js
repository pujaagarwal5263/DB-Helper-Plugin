#!/usr/bin/env node

/**
 * Security Initialization Script
 * Runs on session start to initialize security rules and configuration
 */

const fs = require('fs');
const path = require('path');

// Get plugin root directory
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;

// Load settings
const settingsPath = path.join(PLUGIN_ROOT, 'settings.json');
let settings = {};

try {
  if (fs.existsSync(settingsPath)) {
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    settings = JSON.parse(settingsContent);
  }
} catch (error) {
  console.error('Error loading settings:', error.message);
}

// Initialize security configuration
const securityConfig = {
  environment: settings.settings?.environment || 'development',
  strictMode: settings.settings?.strict_mode || false,
  blockedPatterns: settings.settings?.security?.blocked_patterns || [],
  allowedPatterns: settings.settings?.security?.allowed_patterns || [],
  confirmationRequired: settings.settings?.security?.confirmation_required || [],
  sessionStartTime: new Date().toISOString(),
  auditLog: []
};

// Create security state file
const securityStatePath = path.join(PLUGIN_ROOT, '.security-state.json');
fs.writeFileSync(securityStatePath, JSON.stringify(securityConfig, null, 2));

// Log initialization
console.log('DB-Helper Security Initialized');
console.log('===============================');
console.log(`Environment: ${securityConfig.environment}`);
console.log(`Strict Mode: ${securityConfig.strictMode}`);
console.log(`Blocked Patterns: ${securityConfig.blockedPatterns.length}`);
console.log(`Allowed Patterns: ${securityConfig.allowedPatterns.length}`);
console.log(`Confirmation Required: ${securityConfig.confirmationRequired.length}`);
console.log(`Session Started: ${securityConfig.sessionStartTime}`);
console.log('');

// Environment-specific initialization
if (securityConfig.environment === 'production') {
  console.log('⚠️  PRODUCTION ENVIRONMENT DETECTED');
  console.log('Enhanced security rules are active');
  console.log('All destructive operations require explicit confirmation');
} else if (securityConfig.environment === 'staging') {
  console.log('STAGING ENVIRONMENT DETECTED');
  console.log('Standard security rules are active');
} else {
  console.log('DEVELOPMENT ENVIRONMENT DETECTED');
  console.log('Relaxed security rules for development');
}

console.log('');
console.log('Security hooks are now active');
console.log('Dangerous operations will be blocked or require confirmation');
