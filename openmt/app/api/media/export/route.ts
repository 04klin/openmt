import { NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allMedia = await db.select().from(media).orderBy(desc(media.createdAt));
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      itemCount: allMedia.length,
      data: allMedia,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="openmt-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
