#!/usr/bin/env node

/**
 * Git Safety Validation Script
 * Provides git-specific security checks and validations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get plugin root directory
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;

/**
 * Check if current branch is protected
 */
function isProtectedBranch(branchName) {
  const protectedBranches = ['main', 'master', 'production', 'prod', 'staging'];
  return protectedBranches.includes(branchName.toLowerCase());
}

/**
 * Validate git push command
 */
function validateGitPush(command) {
  const issues = [];
  const warnings = [];

  // Extract branch name from command
  const branchMatch = command.match(/(?:push|origin)\s+(\S+)/);
  const branchName = branchMatch ? branchMatch[1] : null;

  // Check for push to protected branch
  if (branchName && isProtectedBranch(branchName)) {
    issues.push(`Pushing to protected branch "${branchName}" requires explicit approval`);
  }

  // Check for force push
  if (command.includes('--force') || command.includes('-f')) {
    issues.push('Force push can overwrite remote history and is dangerous');
  }

  // Check for push without branch specification
  if (!command.includes('origin') && !branchName) {
    warnings.push('Push without branch specification may push to wrong branch');
  }

  return { issues, warnings, branchName };
}

/**
 * Validate git branch deletion
 */
function validateBranchDeletion(command) {
  const issues = [];
  const warnings = [];

  // Extract branch name
  const branchMatch = command.match(/-d\s+(\S+)/);
  const branchName = branchMatch ? branchMatch[1] : null;

  if (branchName && isProtectedBranch(branchName)) {
    issues.push(`Deleting protected branch "${branchName}" is not allowed`);
  }

  // Check for force deletion
  if (command.includes('-D')) {
    issues.push('Force branch deletion (-D) bypasses safety checks');
  }

  return { issues, warnings, branchName };
}

/**
 * Get current git branch
 */
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Check if working directory is clean
 */
function isWorkingDirectoryClean() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim() === '';
  } catch (error) {
    return false;
  }
}

/**
 * Validate git operation based on current state
 */
function validateGitOperation(command) {
  const issues = [];
  const warnings = [];

  const currentBranch = getCurrentBranch();
  const isClean = isWorkingDirectoryClean();

  // Warn if working directory is not clean
  if (!isClean) {
    warnings.push('Working directory has uncommitted changes');
  }

  // Warn if on protected branch
  if (currentBranch && isProtectedBranch(currentBranch)) {
    warnings.push(`Currently on protected branch "${currentBranch}"`);
  }

  // Specific command validations
  if (command.includes('push')) {
    const pushValidation = validateGitPush(command);
    issues.push(...pushValidation.issues);
    warnings.push(...pushValidation.warnings);
  }

  if (command.includes('branch') && command.includes('-d')) {
    const branchValidation = validateBranchDeletion(command);
    issues.push(...branchValidation.issues);
    warnings.push(...branchValidation.warnings);
  }

  // Check for git reset
  if (command.includes('reset') && command.includes('--hard')) {
    issues.push('Hard reset discards all uncommitted changes');
  }

  // Check for git clean
  if (command.includes('clean') && command.includes('-f')) {
    issues.push('Git clean with -f removes untracked files');
  }

  return { issues, warnings, currentBranch, isClean };
}

/**
 * Get safety message for git operation
 */
function getSafetyMessage(validation) {
  let message = '';

  if (validation.issues.length > 0) {
    message += '🚫 GIT SAFETY ISSUES:\n';
    validation.issues.forEach(issue => {
      message += `  - ${issue}\n`;
    });
    message += '\n';
  }

  if (validation.warnings.length > 0) {
    message += '⚠️  GIT WARNINGS:\n';
    validation.warnings.forEach(warning => {
      message += `  - ${warning}\n`;
    });
    message += '\n';
  }

  if (validation.currentBranch) {
    message += `Current branch: ${validation.currentBranch}\n`;
  }

  if (validation.isClean === false) {
    message += 'Working directory: DIRTY (uncommitted changes)\n';
  } else {
    message += 'Working directory: CLEAN\n';
  }

  return message;
}

// Export functions for use in other scripts
module.exports = {
  isProtectedBranch,
  validateGitPush,
  validateBranchDeletion,
  getCurrentBranch,
  isWorkingDirectoryClean,
  validateGitOperation,
  getSafetyMessage
};

// If run directly, validate from command line argument
if (require.main === module) {
  const command = process.argv[2] || '';
  
  if (!command) {
    console.log('Usage: node git-safety.js "<git command>"');
    console.log('Example: node git-safety.js "git push origin main"');
    process.exit(1);
  }

  const validation = validateGitOperation(command);
  const message = getSafetyMessage(validation);

  if (message) {
    console.log('');
    console.log(message);
    
    if (validation.issues.length > 0) {
      console.log('To proceed with this operation, explicitly state:');
      console.log('"I confirm I want to execute this git operation despite safety warnings"');
      console.log('');
      process.exit(1);
    }
  } else {
    console.log('✅ Git operation appears safe');
  }

  process.exit(0);
}
