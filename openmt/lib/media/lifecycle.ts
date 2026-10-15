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

  const currentVolume = input.metadata?.currentVolume ?? 1;
  const maxVolumes = input.metadata?.maxVolumes;
  const complete = input.mediaType === "manga"
    ? Boolean(maxVolumes && currentVolume >= maxVolumes && input.maxProgress && input.maxProgress > 0 && input.currentProgress >= input.maxProgress)
    : Boolean(input.maxProgress && input.maxProgress > 0 && input.currentProgress >= input.maxProgress);

  if (complete) return "completed";
  if (input.status === "backlog" && (input.currentProgress > 0 || (input.mediaType === "manga" && currentVolume > 1))) {
    return "active";
  }
  return input.status;
}

export function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}
