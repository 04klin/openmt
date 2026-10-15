import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media, MEDIA_TYPES, STATUSES } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { deriveMediaStatus } from "@/lib/media/lifecycle";
import { getCurrentUser } from "@/lib/auth";
import { and } from "drizzle-orm";

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
    const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const validated = updateMediaSchema.parse(body);

    // Fetch existing item
    const [existing] = await db
      .select()
      .from(media)
      .where(and(eq(media.id, id), eq(media.userId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Determine lifecycle state transition in one shared domain function.
    const isManga = (validated.mediaType ?? existing.mediaType) === "manga";
    let updatedStatus = validated.status ?? existing.status;
    const newProgress =
      validated.currentProgress !== undefined
        ? validated.currentProgress
        : existing.currentProgress;
    const effectiveMaxProgress =
      validated.maxProgress !== undefined
        ? validated.maxProgress
        : existing.maxProgress;

    // Merge metadata safely
    const mergedMetadata = {
      ...(existing.metadata ?? {}),
      ...(validated.metadata ?? {}),
    };
    updatedStatus = deriveMediaStatus({ mediaType: isManga ? "manga" : existing.mediaType, status: updatedStatus, currentProgress: newProgress, maxProgress: effectiveMaxProgress, metadata: mergedMetadata, allowAutomaticTransition: validated.status === undefined });

    const updateData: Record<string, unknown> = {
      ...validated,
      status: updatedStatus,
      updatedAt: new Date(),
    };

    if (validated.metadata !== undefined || existing.metadata !== null) {
      updateData.metadata = mergedMetadata;
    }

    const [updated] = await db
      .update(media)
      .set(updateData)
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
    const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { id } = await params;
    const [deleted] = await db
      .delete(media)
      .where(and(eq(media.id, id), eq(media.userId, user.id)))
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
