import React, { useState, useEffect } from "react";
import { Media, MediaType, MediaStatus } from "@/db/schema";
import { MediaBadge, MEDIA_TYPE_CONFIG } from "./MediaBadge";
import {
  Sparkles,
  Dice5,
  Clock,
  Play,
  RotateCcw,
  X,
  ExternalLink,
  Flame,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PickForMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaPool: Media[];
  onStartConsuming: (id: string) => void;
}

type TimeOption = "short" | "medium" | "any";

export function PickForMeModal({
  isOpen,
  onClose,
  mediaPool,
  onStartConsuming,
}: PickForMeModalProps) {
  const [selectedMedium, setSelectedMedium] = useState<MediaType | "all">("all");
  const [selectedTime, setSelectedTime] = useState<TimeOption>("any");
  const [selectedPool, setSelectedPool] = useState<"all" | "backlog" | "active">("all");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Media | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setWinner(null);
      setIsSpinning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter pool based on criteria
  const eligibleItems = mediaPool.filter((item) => {
    // Medium filter
    if (selectedMedium !== "all" && item.mediaType !== selectedMedium) {
      return false;
    }

    // Pool filter
    if (selectedPool === "backlog" && item.status !== "backlog") return false;
    if (selectedPool === "active" && item.status !== "active") return false;

    // Time filter
    if (selectedTime === "short") {
      // Short: Manga (chapters), Anime (20min ep), or Book
      if (item.mediaType === "movie") return false;
    } else if (selectedTime === "medium") {
      // 1-2 hours: Movies or long TV/Book sessions
      if (item.mediaType === "movie") return true;
    }

    return true;
  });

  const handleSpin = () => {
    if (eligibleItems.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    let count = 0;
    const maxSteps = 16;
    const interval = setInterval(() => {
      count++;
      const randomIndex = Math.floor(Math.random() * eligibleItems.length);
      setWinner(eligibleItems[randomIndex]);

      if (count >= maxSteps) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 90);
  };

  const handleLaunch = () => {
    if (!winner) return;
    if (winner.status === "backlog") {
      onStartConsuming(winner.id);
    }
    if (winner.streamLink) {
      window.open(winner.streamLink, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-6 overflow-hidden">
        {/* Glowing background aura */}
        <div className="absolute -top-24 -right-24 size-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Dice5 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Decision Engine
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Anti-Paralysis
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Stop defaulting to mindless feeds. Pick your next adventure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Filter Controls (Shown when no winner yet or resetting) */}
        {!winner || isSpinning ? (
          <div className="mt-5 space-y-4">
            {/* Time Available */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="size-3.5 text-indigo-400" />
                Available Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "short", label: "< 30 mins", desc: "Quick episode / chapter" },
                  { id: "medium", label: "1 - 2 hours", desc: "Movie / deep read" },
                  { id: "any", label: "No Limit", desc: "Any medium" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTime(t.id as TimeOption)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                      selectedTime === t.id
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40"
                        : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    )}
                  >
                    <span className="text-xs font-semibold">{t.label}</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Medium Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Medium
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "all", label: "Surprise Me" },
                  { value: "anime", label: "Anime" },
                  { value: "manga", label: "Manga" },
                  { value: "tv", label: "TV Shows" },
                  { value: "movie", label: "Movies" },
                  { value: "book", label: "Books" },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMedium(m.value as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                      selectedMedium === m.value
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                        : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200 hover:bg-zinc-800"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Pool */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Pick From
              </label>
              <div className="flex items-center gap-2">
                {[
                  { id: "all", label: "Backlog + Active" },
                  { id: "backlog", label: "Backlog Only" },
                  { id: "active", label: "In Progress Only" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPool(p.id as any)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer",
                      selectedPool === p.id
                        ? "bg-zinc-700 text-white border-zinc-500"
                        : "bg-zinc-800/40 text-zinc-400 border-zinc-700/40 hover:bg-zinc-800"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate summary */}
            <div className="pt-2 text-center">
              <span className="text-xs text-zinc-400">
                {eligibleItems.length} media candidates ready
              </span>
            </div>

            {/* Spin CTA Button */}
            <button
              type="button"
              disabled={eligibleItems.length === 0 || isSpinning}
              onClick={handleSpin}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer",
                eligibleItems.length > 0
                  ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white hover:brightness-110 active:scale-98 shadow-indigo-500/25"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
            >
              <Sparkles className="size-4 animate-spin" />
              {isSpinning ? "Rolling the Fate Wheel..." : "Roll & Decide For Me!"}
            </button>
          </div>
        ) : (
          /* Winner Display Card */
          <div className="mt-5 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-zinc-800/70 border border-indigo-500/40 ring-1 ring-indigo-500/30 flex gap-4 items-start shadow-xl">
              {winner.coverImageUrl ? (
                <img
                  src={winner.coverImageUrl}
                  alt={winner.title}
                  className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl shadow-lg ring-1 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-24 aspect-[2/3] rounded-xl bg-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
                  <Sparkles className="size-8" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <MediaBadge type={winner.mediaType as MediaType} />
                  <span className="text-[11px] font-mono text-zinc-400">
                    Status: {winner.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white line-clamp-2">
                  {winner.title}
                </h4>

                {winner.maxProgress ? (
                  <p className="text-xs text-indigo-300 font-mono">
                    Progress: {winner.currentProgress} / {winner.maxProgress}
                  </p>
                ) : null}

                {winner.genres && winner.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {winner.genres.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/60 text-zinc-300 border border-zinc-600/40"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpin}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Spin Again
              </button>

              <button
                type="button"
                onClick={handleLaunch}
                className="flex-[2] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="size-3.5 fill-current" />
                {winner.status === "backlog" ? "Start Now" : "Launch & Continue"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
