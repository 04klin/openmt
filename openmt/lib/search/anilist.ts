import { NormalizedMediaResult } from "@/lib/types";

const ANILIST_GRAPHQL_ENDPOINT = "https://graphql.anilist.co";

const ANILIST_QUERY = `
query ($search: String, $type: MediaType, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: $type, sort: POPULARITY_DESC) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      type
      format
      status
      description
      seasonYear
      episodes
      chapters
      volumes
      genres
      averageScore
      bannerImage
      coverImage {
        extraLarge
        large
        medium
        color
      }
      siteUrl
      studios(isMain: true) {
        nodes {
          name
        }
      }
      staff(perPage: 2) {
        edges {
          role
          node {
            name {
              full
            }
          }
        }
      }
    }
  }
}
`;

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
}

export async function searchAniList(
  query: string,
  type: "ANIME" | "MANGA" = "ANIME",
  limit = 8
): Promise<NormalizedMediaResult[]> {
  try {
    const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: {
          search: query,
          type: type,
          perPage: limit,
        },
      }),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("AniList API returned error status:", response.status);
      return [];
    }

    const data = await response.json();
    const mediaList = data?.data?.Page?.media || [];

    return mediaList.map((item: any): NormalizedMediaResult => {
      const isAnime = item.type === "ANIME";
      const title = item.title.english || item.title.romaji || item.title.native || "Unknown Title";
      const originalTitle = item.title.native || item.title.romaji;
      const creators: string[] = [];

      if (item.studios?.nodes?.[0]?.name) {
        creators.push(item.studios.nodes[0].name);
      }
      if (item.staff?.edges) {
        item.staff.edges.forEach((edge: any) => {
          if (edge.node?.name?.full) {
            creators.push(`${edge.node.name.full} (${edge.role || "Staff"})`);
          }
        });
      }

      return {
        id: `anilist-${item.id}`,
        provider: "anilist",
        title,
        originalTitle: originalTitle !== title ? originalTitle : undefined,
        mediaType: isAnime ? "anime" : "manga",
        coverImageUrl: item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium,
        bannerImageUrl: item.bannerImage,
        synopsis: stripHtml(item.description),
        maxProgress: isAnime ? (item.episodes ?? null) : (item.chapters ?? null),
        progressUnit: isAnime ? "episodes" : "chapters",
        genres: item.genres || [],
        year: item.seasonYear,
        creators: creators.length > 0 ? creators : undefined,
        streamLink: item.siteUrl,
        metadata: {
          episodes: item.episodes,
          volumes_count: item.volumes,
          external_ids: {
            anilist_id: item.id,
            mal_id: item.idMal,
          },
          external_url: item.siteUrl,
          release_year: item.seasonYear,
          synopsis: stripHtml(item.description),
          progress_unit: isAnime ? "episodes" : "chapters",
        },
      };
    });
  } catch (error) {
    console.error("Failed to query AniList API:", error);
    return [];
  }
}
