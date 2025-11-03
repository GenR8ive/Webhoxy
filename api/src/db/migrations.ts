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

