import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import { scryptSync } from "crypto";

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const dbPath =
  process.env.DATABASE_URL?.replace(/^sqlite:\/\//, "") ||
  path.resolve(process.cwd(), "sqlite.db");

const sqlite = globalForDb.sqlite ?? new Database(dbPath);

// Enable WAL mode for better write-ahead performance
try {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  
  // Ensure table exists
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'local-user',
      title TEXT NOT NULL,
      media_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'backlog',
      current_progress INTEGER NOT NULL DEFAULT 0,
      max_progress INTEGER,
      cover_image_url TEXT,
      stream_link TEXT,
      rating INTEGER,
      start_date TEXT,
      end_date TEXT,
      tags TEXT,
      genres TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);
  try { sqlite.exec("ALTER TABLE media ADD COLUMN user_id TEXT NOT NULL DEFAULT 'local-user'"); } catch { /* already exists */ }
  // Upgrade an earlier development version that created users with email/name.
  const userColumns = sqlite.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (userColumns.length > 0 && !userColumns.some((column) => column.name === "username")) {
    sqlite.exec("ALTER TABLE users RENAME TO users_legacy");
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
  }
  const adminHash = scryptSync("admin", "openmt-password-salt", 64).toString("hex");
  sqlite.prepare("INSERT OR IGNORE INTO users (id, username, role, password_hash) VALUES (?, ?, 'admin', ?)").run("admin", "admin", adminHash);
  sqlite.prepare("UPDATE media SET user_id = 'admin' WHERE user_id = 'local-user'").run();
} catch (e) {
  console.error("Database initialization error:", e);
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
