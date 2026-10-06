import { MediaType, MediaStatus, MediaMetadata } from "@/db/schema";

export type NormalizedMediaResult = {
  id: string;
  provider: "anilist" | "tvmaze" | "tmdb" | "omdb" | "googlebooks" | "openlibrary" | "manual";
  title: string;
  originalTitle?: string;
  mediaType: MediaType;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  synopsis?: string;
  maxProgress?: number;
  progressUnit: "episodes" | "chapters" | "pages" | "minutes" | "units";
  genres?: string[];
  year?: number | string;
  creators?: string[];
  streamLink?: string;
  metadata?: MediaMetadata;
};

export type FilterType = "all" | MediaType;
export type FilterStatus = "all" | MediaStatus;

export type CreateMediaInput = {
  title: string;
  mediaType: MediaType;
  status?: MediaStatus;
  currentProgress?: number;
  maxProgress?: number | null;
  coverImageUrl?: string | null;
  streamLink?: string | null;
  rating?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
  genres?: string[];
  metadata?: MediaMetadata;
};

export type UpdateMediaInput = Partial<CreateMediaInput>;
