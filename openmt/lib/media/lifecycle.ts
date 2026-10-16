import { MediaMetadata, MediaStatus, MediaType } from "@/db/schema";

export function deriveMediaStatus(input: {
  mediaType: MediaType;
  status: MediaStatus;
  currentProgress: number;
  maxProgress?: number | null;
  metadata?: MediaMetadata | null;
  allowAutomaticTransition?: boolean;
}): MediaStatus {
  if (input.allowAutomaticTransition === false) return input.status;

  const isGrouped = input.mediaType === "manga" || input.mediaType === "tv";
  const currentPart = input.mediaType === "tv" ? (input.metadata?.currentSeason ?? 1) : (input.metadata?.currentVolume ?? 1);
  const maxParts = input.mediaType === "tv" ? input.metadata?.maxSeasons : input.metadata?.maxVolumes;
  const complete = isGrouped
    ? Boolean(maxParts && currentPart >= maxParts && input.maxProgress && input.maxProgress > 0 && input.currentProgress >= input.maxProgress)
    : Boolean(input.maxProgress && input.maxProgress > 0 && input.currentProgress >= input.maxProgress);

  if (complete) return "completed";
  if (input.status === "backlog" && (input.currentProgress > 0 || (isGrouped && currentPart > 1))) {
    return "active";
  }
  return input.status;
}

export function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}
