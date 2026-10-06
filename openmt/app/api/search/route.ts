import { NextRequest, NextResponse } from "next/server";
import { searchAllMedia } from "@/lib/search";
import { MediaType } from "@/db/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const type = (searchParams.get("type") as MediaType | "all") || "all";
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchAllMedia(q, type, Math.min(limit, 20));
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API route error:", error);
    return NextResponse.json(
      { error: "Failed to perform search query" },
      { status: 500 }
    );
  }
}
