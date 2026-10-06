import { MediaType } from "@/db/schema";
import { NormalizedMediaResult } from "@/lib/types";
import { searchAniList } from "./anilist";
import { searchBooks } from "./books";
import { searchMoviesAndTv } from "./shows";

export async function searchAllMedia(
  query: string,
  mediaType: MediaType | "all" = "all",
  limit = 10
): Promise<NormalizedMediaResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const promises: Promise<NormalizedMediaResult[]>[] = [];

  if (mediaType === "all") {
    // Parallelize across Anime, Manga, TV/Movie, and Books
    promises.push(searchAniList(trimmed, "ANIME", 4));
    promises.push(searchAniList(trimmed, "MANGA", 4));
    promises.push(searchMoviesAndTv(trimmed, "all", 4));
    promises.push(searchBooks(trimmed, 4));
  } else if (mediaType === "anime") {
    promises.push(searchAniList(trimmed, "ANIME", limit));
  } else if (mediaType === "manga") {
    promises.push(searchAniList(trimmed, "MANGA", limit));
  } else if (mediaType === "book") {
    promises.push(searchBooks(trimmed, limit));
  } else if (mediaType === "tv") {
    promises.push(searchMoviesAndTv(trimmed, "tv", limit));
  } else if (mediaType === "movie") {
    promises.push(searchMoviesAndTv(trimmed, "movie", limit));
  }

  const resultsNested = await Promise.allSettled(promises);
  const combined: NormalizedMediaResult[] = [];

  for (const outcome of resultsNested) {
    if (outcome.status === "fulfilled" && Array.isArray(outcome.value)) {
      combined.push(...outcome.value);
    }
  }

  // Deduplicate by title + mediaType if necessary
  const seen = new Set<string>();
  const unique = combined.filter((item) => {
    const key = `${item.mediaType}:${item.title.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}
