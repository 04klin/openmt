import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media, MEDIA_TYPES, STATUSES } from "@/db/schema";
import { z } from "zod";

const bulkSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().min(1),
      mediaType: z.enum(MEDIA_TYPES),
      status: z.enum(STATUSES).default("backlog"),
      currentProgress: z.number().int().min(0).default(0),
      maxProgress: z.number().int().min(0).nullable().optional(),
      coverImageUrl: z.string().nullable().optional(),
      streamLink: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
      genres: z.array(z.string()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = bulkSchema.parse(body);

    if (items.length === 0) {
      return NextResponse.json({ inserted: [] });
    }

    const insertedList = await db
      .insert(media)
      .values(
        items.map((item) => ({
          title: item.title,
          mediaType: item.mediaType,
          status: item.status,
          currentProgress: item.currentProgress,
          maxProgress: item.maxProgress,
          coverImageUrl: item.coverImageUrl,
          streamLink: item.streamLink,
          tags: item.tags,
          genres: item.genres,
          metadata: item.metadata,
        }))
      )
      .returning();

    return NextResponse.json({ inserted: insertedList, count: insertedList.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Bulk insert failed:", error);
    return NextResponse.json({ error: "Failed to bulk insert items" }, { status: 500 });
  }
}
