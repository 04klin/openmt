import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media, MEDIA_TYPES, STATUSES } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateMediaSchema = z.object({
  title: z.string().min(1).optional(),
  mediaType: z.enum(MEDIA_TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  currentProgress: z.number().int().min(0).optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateMediaSchema.parse(body);

    // Fetch existing item
    const [existing] = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Determine lifecycle state transition
    let updatedStatus = validated.status ?? existing.status;
    const newProgress =
      validated.currentProgress !== undefined
        ? validated.currentProgress
        : existing.currentProgress;
    const effectiveMaxProgress =
      validated.maxProgress !== undefined
        ? validated.maxProgress
        : existing.maxProgress;

    // If reaching maxProgress and maxProgress > 0, auto-complete
    if (
      effectiveMaxProgress &&
      effectiveMaxProgress > 0 &&
      newProgress >= effectiveMaxProgress
    ) {
      updatedStatus = "completed";
    } else if (
      existing.status === "backlog" &&
      newProgress > 0 &&
      validated.status === undefined
    ) {
      // If user starts making progress from backlog, promote to active
      updatedStatus = "active";
    }

    const [updated] = await db
      .update(media)
      .set({
        ...validated,
        status: updatedStatus,
        updatedAt: new Date(),
      })
      .where(eq(media.id, id))
      .returning();

    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to update media item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(media)
      .where(eq(media.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: deleted });
  } catch (error) {
    console.error("Failed to delete media item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
