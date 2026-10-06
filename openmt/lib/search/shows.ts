import { NormalizedMediaResult } from "@/lib/types";

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function searchTvMaze(query: string, limit = 8): Promise<NormalizedMediaResult[]> {
  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, limit).map((entry: any): NormalizedMediaResult => {
      const show = entry.show;
      const cover = show.image?.original || show.image?.medium;
      const premierYear = show.premiered ? show.premiered.substring(0, 4) : undefined;
      const network = show.network?.name || show.webChannel?.name;

      return {
        id: `tvmaze-${show.id}`,
        provider: "tvmaze",
        title: show.name || "Unknown Show",
        mediaType: "tv",
        coverImageUrl: cover ? cover.replace("http://", "https://") : undefined,
        synopsis: stripHtml(show.summary),
        progressUnit: "episodes",
        genres: show.genres || [],
        year: premierYear,
        creators: network ? [network] : undefined,
        streamLink: show.officialSite || show.url,
        metadata: {
          runtime_minutes: show.averageRuntime || show.runtime,
          external_ids: {
            tmdb_id: show.externals?.thetvdb,
          },
          external_url: show.officialSite || show.url,
          synopsis: stripHtml(show.summary),
          progress_unit: "episodes",
        },
      };
    });
  } catch (error) {
    console.error("TVMaze search error:", error);
    return [];
  }
}

export async function searchTmdb(
  query: string,
  targetType: "tv" | "movie" | "all" = "all",
  limit = 8,
  apiKey: string
): Promise<NormalizedMediaResult[]> {
  try {
    const trimmedKey = apiKey.trim();
    const isBearer = trimmedKey.startsWith("eyJ") || trimmedKey.length > 45;

    const basePath =
      targetType === "movie"
        ? "https://api.themoviedb.org/3/search/movie"
        : targetType === "tv"
        ? "https://api.themoviedb.org/3/search/tv"
        : "https://api.themoviedb.org/3/search/multi";

    const url = new URL(basePath);
    url.searchParams.set("query", query);
    if (!isBearer) {
      url.searchParams.set("api_key", trimmedKey);
    }

    const headers: Record<string, string> = {
      accept: "application/json",
    };
    if (isBearer) {
      headers["Authorization"] = `Bearer ${trimmedKey}`;
    }

    const res = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((r: any) => targetType !== "all" || r.media_type === "movie" || r.media_type === "tv")
      .slice(0, limit)
      .map((item: any): NormalizedMediaResult => {
        const isMovie = targetType === "movie" || item.media_type === "movie" || (!item.first_air_date && item.release_date);
        const title = item.title || item.name || "Unknown";
        const cover = item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : undefined;
        const banner = item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : undefined;
        const releaseDate = item.release_date || item.first_air_date;

        return {
          id: `tmdb-${item.id}`,
          provider: "tmdb",
          title,
          originalTitle: item.original_title || item.original_name,
          mediaType: isMovie ? "movie" : "tv",
          coverImageUrl: cover,
          bannerImageUrl: banner,
          synopsis: item.overview,
          progressUnit: isMovie ? "minutes" : "episodes",
          year: releaseDate ? releaseDate.substring(0, 4) : undefined,
          metadata: {
            external_ids: { tmdb_id: item.id },
            synopsis: item.overview,
            progress_unit: isMovie ? "minutes" : "episodes",
          },
        };
      });
  } catch (e) {
    console.error("TMDB search error:", e);
    return [];
  }
}

export async function searchOmdb(
  query: string,
  targetType: "tv" | "movie" | "all" = "all",
  limit = 8,
  apiKey: string
): Promise<NormalizedMediaResult[]> {
  try {
    const typeParam = targetType === "tv" ? "&type=series" : targetType === "movie" ? "&type=movie" : "";
    const res = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}${typeParam}&apikey=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (data.Response !== "True" || !Array.isArray(data.Search)) return [];

    return data.Search.slice(0, limit).map((item: any): NormalizedMediaResult => {
      const isMovie = item.Type === "movie";
      return {
        id: `omdb-${item.imdbID}`,
        provider: "omdb",
        title: item.Title,
        mediaType: isMovie ? "movie" : "tv",
        coverImageUrl: item.Poster && item.Poster !== "N/A" ? item.Poster : undefined,
        year: item.Year ? item.Year.substring(0, 4) : undefined,
        progressUnit: isMovie ? "minutes" : "episodes",
        streamLink: `https://www.imdb.com/title/${item.imdbID}/`,
        metadata: {
          external_ids: { imdb_id: item.imdbID },
          progress_unit: isMovie ? "minutes" : "episodes",
        },
      };
    });
  } catch (e) {
    console.error("OMDb search error:", e);
    return [];
  }
}

export async function searchItunesMovies(query: string, limit = 8): Promise<NormalizedMediaResult[]> {
  try {
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=US&media=movie&entity=movie&limit=${limit}`,
      { next: { revalidate: 3600 } }
    );
    if (!itunesRes.ok) return [];

    const itunesData = await itunesRes.json();
    if (!itunesData.results || !Array.isArray(itunesData.results)) return [];

    return itunesData.results.map((item: any): NormalizedMediaResult => {
      let artwork = item.artworkUrl100;
      if (artwork) {
        artwork = artwork.replace("100x100bb", "600x600bb");
      }
      const runtimeMinutes = item.trackTimeMillis
        ? Math.round(item.trackTimeMillis / 60000)
        : undefined;

      return {
        id: `itunes-${item.trackId}`,
        provider: "tmdb",
        title: item.trackName || item.collectionName || "Unknown Movie",
        mediaType: "movie",
        coverImageUrl: artwork,
        synopsis: item.longDescription || item.shortDescription,
        maxProgress: runtimeMinutes,
        progressUnit: "minutes",
        genres: item.primaryGenreName ? [item.primaryGenreName] : [],
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : undefined,
        creators: item.artistName ? [item.artistName] : undefined,
        streamLink: item.trackViewUrl,
        metadata: {
          runtime_minutes: runtimeMinutes,
          synopsis: item.longDescription || item.shortDescription,
          external_url: item.trackViewUrl,
          progress_unit: "minutes",
        },
      };
    });
  } catch (e) {
    console.error("iTunes movie search error:", e);
    return [];
  }
}

export async function searchMoviesAndTv(
  query: string,
  targetType: "tv" | "movie" | "all" = "all",
  limit = 8
): Promise<NormalizedMediaResult[]> {
  const tmdbKey = process.env.TMDB_API_KEY;
  const omdbKey = process.env.OMDB_API_KEY;

  // 1. If TMDB key is provided, use TMDB (Gold standard for Box Office Movies and TV Shows)
  if (tmdbKey) {
    const tmdbResults = await searchTmdb(query, targetType, limit, tmdbKey);
    if (tmdbResults.length > 0) {
      return tmdbResults;
    }
  }

  // 2. If OMDb key is provided, use OMDb
  if (omdbKey) {
    const omdbResults = await searchOmdb(query, targetType, limit, omdbKey);
    if (omdbResults.length > 0) {
      return omdbResults;
    }
  }

  // 3. Fallback / Default keyless providers
  const results: NormalizedMediaResult[] = [];

  // For TV or ALL: use TVMaze (Free & Keyless)
  if (targetType === "tv" || targetType === "all") {
    const tvMazeResults = await searchTvMaze(query, limit);
    results.push(...tvMazeResults);
  }

  // For Movie or ALL: use iTunes Movie Search (Free & Keyless)
  if (targetType === "movie" || targetType === "all") {
    const itunesResults = await searchItunesMovies(query, limit);
    results.push(...itunesResults);
  }

  return results.slice(0, limit);
}
