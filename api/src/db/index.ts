import Database from 'better-sqlite3';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { runMigrations } from './migrations.js';

export interface DB extends Database.Database {
  // Add custom methods if needed
}

export async function initDatabase(databaseUrl: string): Promise<DB> {
  // Ensure data directory exists
  const dbPath = databaseUrl.replace('sqlite:', '').replace('file:', '');
  const dbDir = dirname(dbPath);
  
  try {
    await mkdir(dbDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Create database connection
  const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  }) as DB;
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Run migrations
  runMigrations(db);
  
  return db;
}

export * from './types.js';

