import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : body.data;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid backup format: expected array of media items or { data: [...] }" },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    for (const item of items) {
      if (!item.title || !item.mediaType) continue;

      await db
        .insert(media)
        .values({
          id: item.id || crypto.randomUUID(),
          title: item.title,
          mediaType: item.mediaType,
          status: item.status || "backlog",
          currentProgress: Number(item.currentProgress) || 0,
          maxProgress: item.maxProgress ? Number(item.maxProgress) : null,
          coverImageUrl: item.coverImageUrl || null,
          streamLink: item.streamLink || null,
          rating: item.rating ? Number(item.rating) : null,
          startDate: item.startDate || null,
          endDate: item.endDate || null,
          tags: item.tags || [],
          genres: item.genres || [],
          metadata: item.metadata || {},
        })
        .onConflictDoNothing();

      insertedCount++;
    }

    return NextResponse.json({ success: true, count: insertedCount });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 });
  }
}
