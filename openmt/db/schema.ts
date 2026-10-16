import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const MEDIA_TYPES = ["anime", "tv", "movie", "manga", "book"] as const;
export const STATUSES = [
  "backlog",
  "active",
  "hold",
  "completed",
  "dropped",
] as const;

export type MediaMetadata = {
  season?: string;
  episodes?: number;
  external_ids?: {
    mal_id?: number;
    anilist_id?: number;
    tmdb_id?: number;
    googlebooks_id?: string;
    isbn?: string;
  };
  total_seasons?: number;
  runtime_minutes?: number;
  volumes_count?: number;
  /** Current volume the reader is on (manga-specific) */
  currentVolume?: number;
  /** Maximum known volumes for a manga series */
  maxVolumes?: number;
  /** Current season the viewer is on (TV-specific) */
  currentSeason?: number;
  /** Maximum known seasons for a TV series */
  maxSeasons?: number;
  isbn?: string;
  authors?: string[];
  banner_image_url?: string;
  synopsis?: string;
  progress_unit?: "episodes" | "chapters" | "pages" | "minutes" | "units";
  external_url?: string;
  release_year?: number | string;
  /** Normalized release year used by the catalog sort. */
  year?: number | string;
};

export const media = sqliteTable("media", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().default("local-user"),
  title: text("title").notNull(),
  mediaType: text("media_type", { enum: MEDIA_TYPES }).notNull(),
  status: text("status", { enum: STATUSES }).default("backlog").notNull(),

  currentProgress: integer("current_progress").default(0).notNull(),
  maxProgress: integer("max_progress"),
  coverImageUrl: text("cover_image_url"),
  streamLink: text("stream_link"),

  // Custom universal columns
  rating: integer("rating"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  genres: text("genres", { mode: "json" }).$type<string[]>(),

  // Strongly typed JSON metadata
  metadata: text("metadata", { mode: "json" }).$type<MediaMetadata>(),

  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type MediaType = (typeof MEDIA_TYPES)[number];
export type MediaStatus = (typeof STATUSES)[number];
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type User = typeof users.$inferSelect;
