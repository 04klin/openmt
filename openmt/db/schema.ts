// db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Enums (SQLite doesn't have native enums, so we enforce via TypeScript/Zod later)
export const MEDIA_TYPES = ["anime", "tv", "movie", "manga", "book"] as const;
export const STATUSES = [
  "backlog",
  "active",
  "hold",
  "completed",
  "dropped",
] as const;

export const media = sqliteTable("media", {
  // Core Identifiers
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  mediaType: text("media_type").notNull(), // 'anime' | 'tv' | 'movie' | 'manga' | 'book'

  // Tracking & State
  status: text("status").default("backlog").notNull(),
  currentProgress: integer("current_progress").default(0).notNull(), // Episodes, chapters, pages, or minutes
  maxProgress: integer("max_progress"), // Nullable because ongoing series might not have a known end
  rating: integer("rating"), // 1-5 or 1-10 scale for completed items

  // Actionable Links & Assets
  coverImageUrl: text("cover_image_url"),
  streamLink: text("stream_link"), // Direct URL or deep link (e.g., crunchyroll://)

  // Polymorphic Metadata (JSON)
  // Stores type-specific data like { author: "...", isbn: "..." } or { network: "...", seasonCount: 3 }
  metadata: text("metadata", { mode: "json" }),

  // Tags for the "Pick For Me" Engine (stored as JSON array: ["sci-fi", "chill", "quick"])
  tags: text("tags", { mode: "json" }).$type<string[]>(),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export type MediaType = (typeof MEDIA_TYPES)[number];
export type MediaStatus = (typeof STATUSES)[number];

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
