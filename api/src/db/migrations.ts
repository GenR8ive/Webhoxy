import Database from 'better-sqlite3';

interface Migration {
  id: number;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    id: 1,
    name: 'initial_schema',
    sql: `
      -- Create webhooks table
      CREATE TABLE IF NOT EXISTS webhooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        target_url TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Create mappings table
      CREATE TABLE IF NOT EXISTS mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id INTEGER NOT NULL,
        source_field TEXT NOT NULL,
        target_field TEXT NOT NULL,
        fixed_value TEXT,
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      );

      -- Create logs table
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id INTEGER NOT NULL,
        payload TEXT NOT NULL,
        response_code INTEGER NOT NULL,
        response_body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_mappings_webhook_id ON mappings(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_logs_webhook_id ON logs(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
    `,
  },
  {
    id: 2,
    name: 'add_source_payload',
    sql: `
      -- Add source_payload column to store original incoming webhook data
      ALTER TABLE logs ADD COLUMN source_payload TEXT;
      
      -- For existing rows, copy payload to source_payload
      UPDATE logs SET source_payload = payload WHERE source_payload IS NULL;
    `,
  },
  {
    id: 3,
    name: 'create_source_fields_table',
    sql: `
      -- Create source_fields table to persist available fields per webhook
      CREATE TABLE IF NOT EXISTS source_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id INTEGER NOT NULL,
        field_path TEXT NOT NULL,
        field_type TEXT,
        sample_value TEXT,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
        UNIQUE(webhook_id, field_path)
      );
      
      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_source_fields_webhook_id ON source_fields(webhook_id);
    `,
  },
  {
    id: 4,
    name: 'add_webhook_security',
    sql: `
      -- Add security columns to webhooks table
      ALTER TABLE webhooks ADD COLUMN api_key TEXT;
      ALTER TABLE webhooks ADD COLUMN allowed_ips TEXT;
      ALTER TABLE webhooks ADD COLUMN require_api_key INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE webhooks ADD COLUMN require_ip_whitelist INTEGER NOT NULL DEFAULT 0;
      
      -- Create index for API key lookups
      CREATE INDEX IF NOT EXISTS idx_webhooks_api_key ON webhooks(api_key);
    `,
  },
  {
    id: 5,
    name: 'create_users_table',
    sql: `
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        must_change_password INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      -- Create index for username lookups
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `,
  },
  {
    id: 6,
    name: 'create_activities_table',
    sql: `
      -- Create activities table for audit logging
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
      CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
    `,
  },
  {
    id: 7,
    name: 'create_refresh_tokens_table',
    sql: `
      -- Create refresh_tokens table
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    `,
  },
  {
    id: 8,
    name: 'add_deduplication',
    sql: `
      -- Add deduplication settings to webhooks table
      ALTER TABLE webhooks ADD COLUMN deduplication_enabled INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE webhooks ADD COLUMN deduplication_window INTEGER NOT NULL DEFAULT 60; -- Default 60 seconds

      -- Create processed_webhooks table to track duplicates
      CREATE TABLE IF NOT EXISTS processed_webhooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id INTEGER NOT NULL,
        request_hash TEXT NOT NULL,
        processed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      );

      -- Create indexes for fast lookups
      CREATE INDEX IF NOT EXISTS idx_processed_webhooks_lookup ON processed_webhooks(webhook_id, request_hash);
      CREATE INDEX IF NOT EXISTS idx_processed_webhooks_time ON processed_webhooks(processed_at);
    `,
  },
  {
    id: 9,
    name: 'add_unique_constraint_processed_webhooks',
    sql: `
      -- Create a new table with unique constraint on webhook_id and request_hash only
      CREATE TABLE IF NOT EXISTS processed_webhooks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id INTEGER NOT NULL,
        request_hash TEXT NOT NULL,
        processed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
        UNIQUE(webhook_id, request_hash)
      );

      -- Copy existing data (keeping only the most recent entry for each webhook_id + request_hash combination)
      INSERT INTO processed_webhooks_new (webhook_id, request_hash, processed_at)
      SELECT webhook_id, request_hash, MAX(processed_at) as processed_at
      FROM processed_webhooks
      GROUP BY webhook_id, request_hash;

      -- Drop old table
      DROP TABLE processed_webhooks;

      -- Rename new table
      ALTER TABLE processed_webhooks_new RENAME TO processed_webhooks;

      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_processed_webhooks_lookup ON processed_webhooks(webhook_id, request_hash);
      CREATE INDEX IF NOT EXISTS idx_processed_webhooks_time ON processed_webhooks(processed_at);
    `,
  },
  {
    id: 10,
    name: 'add_webhook_uuid',
    sql: `
      -- Add uuid column to webhooks table
      ALTER TABLE webhooks ADD COLUMN uuid TEXT;

      -- Generate UUIDs for existing webhooks using a simple approach
      -- SQLite doesn't have built-in UUID generation, so we'll use a combination of random values
      -- The application will generate proper UUIDs for new webhooks
      UPDATE webhooks SET uuid = (
        lower(hex(randomblob(4))) || '-' || 
        lower(hex(randomblob(2))) || '-' || 
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' || 
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || 
        lower(hex(randomblob(6)))
      ) WHERE uuid IS NULL;

      -- Make uuid column NOT NULL and UNIQUE
      -- We need to recreate the table to add NOT NULL constraint
      CREATE TABLE webhooks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        target_url TEXT NOT NULL,
        api_key TEXT,
        allowed_ips TEXT,
        require_api_key INTEGER NOT NULL DEFAULT 0,
        require_ip_whitelist INTEGER NOT NULL DEFAULT 0,
        deduplication_enabled INTEGER NOT NULL DEFAULT 0,
        deduplication_window INTEGER NOT NULL DEFAULT 60,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Copy data from old table
      INSERT INTO webhooks_new (id, uuid, name, description, target_url, api_key, allowed_ips, 
                                require_api_key, require_ip_whitelist, deduplication_enabled, 
                                deduplication_window, created_at)
      SELECT id, uuid, name, description, target_url, api_key, allowed_ips, 
             require_api_key, require_ip_whitelist, deduplication_enabled, 
             deduplication_window, created_at
      FROM webhooks;

      -- Drop old table
      DROP TABLE webhooks;

      -- Rename new table
      ALTER TABLE webhooks_new RENAME TO webhooks;

      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_webhooks_api_key ON webhooks(api_key);
      CREATE INDEX IF NOT EXISTS idx_webhooks_uuid ON webhooks(uuid);
    `,
  },
];

export function runMigrations(db: Database.Database): void {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Get applied migrations
  const appliedMigrations = db
    .prepare('SELECT id FROM _migrations ORDER BY id')
    .all() as { id: number }[];

  const appliedIds = new Set(appliedMigrations.map((m) => m.id));

  // Run pending migrations
  for (const migration of migrations) {
    if (!appliedIds.has(migration.id)) {
      console.log(`Running migration ${migration.id}: ${migration.name}`);
      
      db.transaction(() => {
        db.exec(migration.sql);
        db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)').run(
          migration.id,
          migration.name
        );
      })();
      
      console.log(`✓ Migration ${migration.id} completed`);
    }
  }
}

