#!/usr/bin/env node

/**
 * Webhoxy Setup Script
 * Cross-platform Node.js setup script
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, cwd) {
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });
    return true;
  } catch (error) {
    log(`❌ Error executing: ${command}`, 'red');
    return false;
  }
}

function copyEnvFile(dir, source, target) {
  const sourcePath = join(rootDir, dir, source);
  const targetPath = join(rootDir, dir, target);
  
  if (existsSync(targetPath)) {
    log(`⚠️  ${dir}/${target} already exists, skipping...`, 'yellow');
    return false;
  }
  
  if (!existsSync(sourcePath)) {
    log(`⚠️  ${dir}/${source} not found, skipping...`, 'yellow');
    return false;
  }
  
  copyFileSync(sourcePath, targetPath);
  log(`✓ Created ${dir}/${target}`, 'green');
  return true;
}

async function main() {
  log('🚀 Setting up Webhoxy...', 'blue');
  console.log();
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  log(`📦 Node.js version: ${nodeVersion}`, 'blue');
  
  if (majorVersion < 20) {
    log('⚠️  Node.js 20+ is recommended. You might encounter issues.', 'yellow');
  }
  console.log();
  
  // Setup API
  log('🔧 Setting up API...', 'blue');
  const apiDir = join(rootDir, 'api');
  
  copyEnvFile('api', 'env.example', '.env');
  
  log('Installing API dependencies...', 'blue');
  if (!execCommand('npm install', apiDir)) {
    log('Failed to install API dependencies', 'red');
    process.exit(1);
  }
  log('✓ API dependencies installed', 'green');
  console.log();
  
  // Setup Web
  log('🎨 Setting up Web...', 'blue');
  const webDir = join(rootDir, 'web');
  
  copyEnvFile('web', '.env.example', '.env');
  
  log('Installing Web dependencies...', 'blue');
  if (!execCommand('npm install', webDir)) {
    log('Failed to install Web dependencies', 'red');
    process.exit(1);
  }
  log('✓ Web dependencies installed', 'green');
  console.log();
  
  // Create data directory
  log('📁 Creating data directory...', 'blue');
  const dataDir = join(rootDir, 'api', 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  log('✓ Data directory created', 'green');
  console.log();
  
  // Success message
  log('✅ Setup complete!', 'green');
  console.log();
  log('To start development servers:', 'blue');
  log('  npm run dev', 'yellow');
  console.log();
  log('Or start services individually:');
  log('  cd api && npm run dev', 'yellow');
  log('  cd web && npm run dev', 'yellow');
  console.log();
  log('To start with Docker:', 'blue');
  log('  docker-compose up -d', 'yellow');
  console.log();
  log('Happy coding! 🎉', 'green');
}

main().catch(error => {
  log(`❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});

