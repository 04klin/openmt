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
  external_ids?: { mal_id?: number; anilist_id?: number };
  total_seasons?: number;
  runtime_minutes?: number;
  volumes_count?: number;
  isbn?: string;
};

export const media = sqliteTable("media", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
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

export type MediaType = (typeof MEDIA_TYPES)[number];
export type MediaStatus = (typeof STATUSES)[number];
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
