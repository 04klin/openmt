import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media, MEDIA_TYPES, STATUSES } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { deriveMediaStatus, normalizeTitle } from "@/lib/media/lifecycle";

const createMediaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  mediaType: z.enum(MEDIA_TYPES),
  status: z.enum(STATUSES).default("backlog"),
  currentProgress: z.number().int().min(0).default(0),
  maxProgress: z.number().int().min(0).nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  streamLink: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");

    const conditions = [];
    if (statusParam && STATUSES.includes(statusParam as typeof STATUSES[number])) {
      conditions.push(eq(media.status, statusParam as typeof STATUSES[number]));
    }
    if (typeParam && MEDIA_TYPES.includes(typeParam as typeof MEDIA_TYPES[number])) {
      conditions.push(eq(media.mediaType, typeParam as typeof MEDIA_TYPES[number]));
    }

    const items =
      conditions.length > 0
        ? await db
            .select()
            .from(media)
            .where(and(...conditions))
            .orderBy(desc(media.createdAt))
        : await db.select().from(media).orderBy(desc(media.createdAt));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch media list:", error);
    return NextResponse.json(
      { error: "Failed to fetch media records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createMediaSchema.parse(body);

    const normalizedTitle = normalizeTitle(validated.title);
    const externalIds = validated.metadata?.external_ids;
    const externalIdChecks = externalIds
      ? Object.entries(externalIds)
          .filter(([key, value]) => ["mal_id", "anilist_id", "tmdb_id", "googlebooks_id", "isbn"].includes(key) && value !== undefined)
          .map(([key, value]) => sql`json_extract(${media.metadata}, '$.external_ids.${sql.raw(key)}') = ${value}`)
      : [];
    const existing = await db.select({ id: media.id }).from(media).where(and(
      eq(media.mediaType, validated.mediaType),
      externalIdChecks.length > 0
        ? sql`(lower(trim(${media.title})) = ${normalizedTitle} OR ${sql.join(externalIdChecks, sql` OR `)})`
        : sql`lower(trim(${media.title})) = ${normalizedTitle}`,
    )).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "This title is already in your library", duplicateId: existing[0].id }, { status: 409 });
    }

    const effectiveStatus = deriveMediaStatus({ ...validated, status: validated.status });

    const [inserted] = await db
      .insert(media)
      .values({
        title: validated.title,
        mediaType: validated.mediaType,
        status: effectiveStatus,
        currentProgress: validated.currentProgress,
        maxProgress: validated.maxProgress,
        coverImageUrl: validated.coverImageUrl,
        streamLink: validated.streamLink,
        rating: validated.rating,
        startDate: validated.startDate,
        endDate: validated.endDate,
        tags: validated.tags,
        genres: validated.genres,
        metadata: validated.metadata,
      })
      .returning();

    return NextResponse.json({ item: inserted }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to create media:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
