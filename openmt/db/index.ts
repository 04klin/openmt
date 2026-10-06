import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

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
  `);
} catch (e) {
  console.error("Database initialization error:", e);
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
