import { NormalizedMediaResult } from "@/lib/types";

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
}

export async function searchBooks(query: string, limit = 8): Promise<NormalizedMediaResult[]> {
  const results: NormalizedMediaResult[] = [];

  // Try Google Books API first
  try {
    const googleRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}`,
      { next: { revalidate: 3600 } }
    );

    if (googleRes.ok) {
      const data = await googleRes.json();
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const info = item.volumeInfo || {};
          const isbnObj = info.industryIdentifiers?.find(
            (id: any) => id.type === "ISBN_13" || id.type === "ISBN_10"
          );
          
          let coverImg =
            info.imageLinks?.extraLarge ||
            info.imageLinks?.large ||
            info.imageLinks?.medium ||
            info.imageLinks?.thumbnail ||
            info.imageLinks?.smallThumbnail;

          if (coverImg && coverImg.startsWith("http://")) {
            coverImg = coverImg.replace("http://", "https://");
          }

          results.push({
            id: `gbook-${item.id}`,
            provider: "googlebooks",
            title: info.title || "Unknown Book",
            originalTitle: info.subtitle,
            mediaType: "book",
            coverImageUrl: coverImg,
            synopsis: stripHtml(info.description),
            maxProgress: info.pageCount || null,
            progressUnit: "pages",
            genres: info.categories || [],
            year: info.publishedDate ? info.publishedDate.substring(0, 4) : undefined,
            creators: info.authors || [],
            streamLink: info.canonicalVolumeLink || info.previewLink,
            metadata: {
              isbn: isbnObj?.identifier,
              authors: info.authors,
              external_ids: {
                googlebooks_id: item.id,
                isbn: isbnObj?.identifier,
              },
              external_url: info.canonicalVolumeLink || info.previewLink,
              synopsis: stripHtml(info.description),
              progress_unit: "pages",
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Google Books search error:", error);
  }

  // If Google Books returned few results, supplement with Open Library
  if (results.length < 3) {
    try {
      const openLibRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`,
        { next: { revalidate: 3600 } }
      );

      if (openLibRes.ok) {
        const data = await openLibRes.json();
        if (data.docs && Array.isArray(data.docs)) {
          for (const doc of data.docs.slice(0, limit - results.length)) {
            const coverUrl = doc.cover_i
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
              : undefined;

            results.push({
              id: `openlib-${doc.key.replace(/\//g, "-")}`,
              provider: "openlibrary",
              title: doc.title || "Unknown Book",
              mediaType: "book",
              coverImageUrl: coverUrl,
              maxProgress: doc.number_of_pages_median || null,
              progressUnit: "pages",
              genres: doc.subject ? doc.subject.slice(0, 4) : [],
              year: doc.first_publish_year,
              creators: doc.author_name || [],
              streamLink: `https://openlibrary.org${doc.key}`,
              metadata: {
                isbn: doc.isbn?.[0],
                authors: doc.author_name,
                external_url: `https://openlibrary.org${doc.key}`,
                progress_unit: "pages",
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("OpenLibrary search error:", error);
    }
  }

  return results;
}
