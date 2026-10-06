import React from "react";
import { MediaType } from "@/db/schema";
import { Film, Tv, BookOpen, Sparkles, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaBadgeProps {
  type: MediaType;
  className?: string;
  showIcon?: boolean;
}

export const MEDIA_TYPE_CONFIG: Record<
  MediaType,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
    glowClass: string;
    borderClass: string;
    textClass: string;
    unitName: string;
  }
> = {
  anime: {
    label: "Anime",
    icon: Sparkles,
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    glowClass: "glow-indigo",
    borderClass: "border-indigo-500/40",
    textClass: "text-indigo-400",
    unitName: "Ep",
  },
  manga: {
    label: "Manga",
    icon: BookMarked,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    glowClass: "glow-emerald",
    borderClass: "border-emerald-500/40",
    textClass: "text-emerald-400",
    unitName: "Ch",
  },
  tv: {
    label: "TV Show",
    icon: Tv,
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    glowClass: "glow-cyan",
    borderClass: "border-sky-500/40",
    textClass: "text-sky-400",
    unitName: "Ep",
  },
  movie: {
    label: "Movie",
    icon: Film,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    glowClass: "glow-amber",
    borderClass: "border-amber-500/40",
    textClass: "text-amber-400",
    unitName: "Min",
  },
  book: {
    label: "Book",
    icon: BookOpen,
    badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    glowClass: "glow-rose",
    borderClass: "border-rose-500/40",
    textClass: "text-rose-400",
    unitName: "Pg",
  },
};

export function MediaBadge({ type, className, showIcon = true }: MediaBadgeProps) {
  const config = MEDIA_TYPE_CONFIG[type] || MEDIA_TYPE_CONFIG.anime;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border backdrop-blur-xs",
        config.badgeClass,
        className
      )}
    >
      {showIcon && <Icon className="size-3" />}
      <span>{config.label}</span>
    </span>
  );
}
