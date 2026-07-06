#!/usr/bin/env node

/**
 * Migration Workflow Orchestrator
 * 
 * Interactive script that guides you through the complete migration process.
 * Handles the entire migration workflow with safety checks and user confirmations.
 * 
 * Usage: node scripts/migration-workflow.js
 */

require('dotenv').config();
const readline = require('readline');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const logger = {
  section: (title) => {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${title}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  },
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  step: (num, total, title) => {
    console.log(`\n${colors.bright}Step ${num}/${total}:${colors.reset} ${title}`);
  },
};

const question = (prompt) => {
  return new Promise(resolve => {
    rl.question(`${colors.bright}${prompt}${colors.reset} `, resolve);
  });
};

const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    logger.info(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { stdio: 'inherit' });

    proc.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
};

async function checkPrerequisites() {
  logger.section('PRE-MIGRATION CHECKS');

  const checks = {
    nodejs: false,
    npm: false,
    npm_dependencies: false,
    postgres_url: false,
    mongodb_url: false,
    backups_dir: false,
  };

  // Check Node.js
  try {
    await runCommand('node', ['--version']);
    checks.nodejs = true;
    logger.success('Node.js is installed');
  } catch (error) {
    logger.error('Node.js not found');
  }

  // Check npm
  try {
    await runCommand('npm', ['--version']);
    checks.npm = true;
    logger.success('npm is installed');
  } catch (error) {
    logger.error('npm not found');
  }

  // Check if node_modules exists
  if (fs.existsSync(path.join(__dirname, '../node_modules'))) {
    checks.npm_dependencies = true;
    logger.success('Dependencies already installed');
  } else {
    logger.warning('Dependencies not installed (will install next)');
  }

  // Check environment variables
  if (process.env.DATABASE_URL) {
    checks.postgres_url = true;
    logger.success('PostgreSQL URL configured');
  } else {
    logger.error('PostgreSQL URL not found in .env');
  }

  if (process.env.MONGODB_URL || process.env.mongo_url) {
    checks.mongodb_url = true;
    logger.success('MongoDB URL configured');
  } else {
    logger.error('MongoDB URL not found in .env');
  }

  // Create backups directory
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  checks.backups_dir = true;
  logger.success('Backups directory ready');

  const allPass = Object.values(checks).every(v => v);

  if (!allPass) {
    logger.section('SETUP REQUIRED');
    if (!checks.postgres_url || !checks.mongodb_url) {
      logger.error('Please configure database URLs in backend/.env');
      return false;
    }
  }

  return true;
}

async function installDependencies() {
  logger.section('INSTALLING DEPENDENCIES');

  const nodePath = path.join(__dirname, '../node_modules');
  if (fs.existsSync(nodePath)) {
    logger.info('Dependencies already installed');
    return true;
  }

  const answer = await question('Install npm dependencies? (y/n): ');
  if (answer.toLowerCase() !== 'y') {
    return false;
  }

  try {
    await runCommand('npm', ['install']);
    logger.success('Dependencies installed');
    return true;
  } catch (error) {
    logger.error('Failed to install dependencies');
    return false;
  }
}

async function createBackups() {
  logger.section('CREATING BACKUPS');
  logger.warning('Creating backups is CRITICAL before migration!');

  // PostgreSQL backup
  logger.info('Creating PostgreSQL backup...');
  try {
    await runCommand('npm', ['run', 'backup:postgres']);
    logger.success('PostgreSQL backup completed');
  } catch (error) {
    const answer = await question('PostgreSQL backup failed. Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      return false;
    }
  }

  // MongoDB backup
  logger.info('Creating MongoDB backup...');
  try {
    await runCommand('npm', ['run', 'backup:mongodb']);
    logger.success('MongoDB backup completed');
  } catch (error) {
    logger.warning('MongoDB backup failed (OK if no data exists)');
  }

  return true;
}

async function dryRun() {
  logger.section('DRY RUN MIGRATION');
  logger.info('Performing dry run to preview migration...');
  logger.info('This will show what WOULD be migrated without making changes.');

  try {
    await runCommand('npm', ['run', 'migrate:dry-run']);
    logger.success('Dry run completed successfully');
    return true;
  } catch (error) {
    logger.error('Dry run failed');
    return false;
  }
}

async function confirmMigration() {
  logger.section('MIGRATION CONFIRMATION');

  logger.warning('WARNING: This will migrate all data from PostgreSQL to MongoDB');
  logger.warning('Make sure you have reviewed the dry run output above!');

  const answer = await question('Proceed with actual migration? (yes/no): ');
  return answer.toLowerCase() === 'yes';
}

async function executeMigration() {
  logger.section('EXECUTING MIGRATION');

  try {
    await runCommand('npm', ['run', 'migrate:to-mongodb']);
    logger.success('Migration completed');
    return true;
  } catch (error) {
    logger.error('Migration failed');
    return false;
  }
}

async function validateMigration() {
  logger.section('VALIDATING MIGRATION');
  logger.info('Verifying data integrity after migration...');

  try {
    await runCommand('npm', ['run', 'migrate:validate']);
    logger.success('Validation completed');
    return true;
  } catch (error) {
    logger.error('Validation failed');
    return false;
  }
}

async function printSummary() {
  logger.section('MIGRATION WORKFLOW COMPLETE');

  logger.success('Migration execution finished!');
  logger.info('\nNext steps:');
  logger.info('1. Review validation output above');
  logger.info('2. Update backend code to use MongoDB');
  logger.info('3. Test all API endpoints');
  logger.info('4. Deploy to production');

  logger.info('\nUseful commands:');
  logger.info('  npm run migrate:validate  - Re-run validation');
  logger.info('  npm run backup:mongodb    - Create MongoDB backup');
  logger.info('  npm run restore:mongodb   - Restore from backup');
  logger.info('  npm run migrate:rollback  - Delete migrated data');

  logger.info('\nDocumentation:');
  logger.info('  See MIGRATION_GUIDE.md for detailed information');
  logger.info('  See MIGRATION_SUMMARY.md for quick reference');
}

async function main() {
  console.clear();
  logger.section('🏨 HOTEL MANAGEMENT SYSTEM - MIGRATION WORKFLOW');
  logger.info('PostgreSQL to MongoDB Migration');
  logger.info('Version: 1.0 (Senior Engineer Edition)\n');

  try {
    // Step 1: Prerequisites
    logger.step(1, 6, 'Checking prerequisites');
    if (!(await checkPrerequisites())) {
      logger.error('Prerequisites check failed. Please fix issues above and try again.');
      process.exit(1);
    }

    // Step 2: Install dependencies
    logger.step(2, 6, 'Installing dependencies');
    if (!(await installDependencies())) {
      logger.warning('Skipped dependency installation');
    }

    // Step 3: Create backups
    logger.step(3, 6, 'Creating backups');
    if (!(await createBackups())) {
      logger.error('Backup creation failed');
      process.exit(1);
    }

    // Step 4: Dry run
    logger.step(4, 6, 'Performing dry run');
    if (!(await dryRun())) {
      logger.error('Dry run failed');
      process.exit(1);
    }

    // Step 5: Confirm and execute
    logger.step(5, 6, 'Executing migration');
    if (!(await confirmMigration())) {
      logger.warning('Migration cancelled by user');
      process.exit(0);
    }

    if (!(await executeMigration())) {
      logger.error('Migration execution failed');
      process.exit(1);
    }

    // Step 6: Validate
    logger.step(6, 6, 'Validating migration');
    await validateMigration();

    await printSummary();
  } catch (error) {
    logger.error('Workflow failed', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
