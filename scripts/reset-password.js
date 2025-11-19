#!/usr/bin/env node

/**
 * Webhoxy Password Reset Script
 * Usage: node scripts/reset-password.js <username> <new_password>
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const DB_PATH = join(rootDir, 'api', 'data', 'webhoxy.db');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    log('Usage: node scripts/reset-password.js <username> <new_password>', 'yellow');
    process.exit(1);
  }
  
  const [username, newPassword] = args;
  
  if (newPassword.length < 8) {
    log('❌ Password must be at least 8 characters long', 'red');
    process.exit(1);
  }
  
  log(`🔒 Resetting password for user: ${username}`, 'blue');
  
  // Check database
  if (!existsSync(DB_PATH)) {
    log(`❌ Database not found at ${DB_PATH}`, 'red');
    log('Make sure you have run the application at least once.', 'yellow');
    process.exit(1);
  }
  
  try {
    const db = new Database(DB_PATH);
    
    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      log(`❌ User '${username}' not found`, 'red');
      process.exit(1);
    }
    
    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    const result = db.prepare(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(passwordHash, user.id);
    
    // Invalidate sessions
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(user.id);
    
    if (result.changes > 0) {
      log(`✅ Password for '${username}' has been successfully reset!`, 'green');
      log('⚠️  The user will be required to change their password upon next login.', 'yellow');
    } else {
      log('❌ Failed to update password', 'red');
    }
    
    db.close();
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
