import React, { useState } from "react";
import { Media, MediaType, MediaStatus } from "@/db/schema";
import { MediaBadge, MEDIA_TYPE_CONFIG } from "./MediaBadge";
import { StatusBadge } from "./StatusBadge";
import { ProgressStepper } from "./ProgressStepper";
import {
  ExternalLink,
  MoreVertical,
  Play,
  CheckCircle2,
  Trash2,
  Edit,
  Clock,
  PauseCircle,
  XCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  item: Media;
  onUpdateProgress: (id: string, newProgress: number) => void;
  onUpdateStatus: (id: string, newStatus: MediaStatus) => void;
  onEdit: (item: Media) => void;
  onDelete: (id: string) => void;
  variant?: "active" | "grid" | "compact";
}

export function MediaCard({
  item,
  onUpdateProgress,
  onUpdateStatus,
  onEdit,
  onDelete,
  variant = "grid",
}: MediaCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const config = MEDIA_TYPE_CONFIG[item.mediaType as MediaType] || MEDIA_TYPE_CONFIG.anime;

  const isActiveVariant = variant === "active";

  const handleLaunch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.streamLink) {
      window.open(item.streamLink, "_blank", "noopener,noreferrer");
    } else {
      onEdit(item);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-3.5 transition-all duration-200 hover:border-zinc-700/90 hover:shadow-xl",
        isActiveVariant && cn("ring-1 ring-white/10 bg-zinc-900/95", config.glowClass)
      )}
    >
      {/* Top Header & Artwork Area */}
      <div className="flex gap-3.5 items-start min-w-0">
        {/* Cover Artwork */}
        <div className="relative shrink-0 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/10 w-20 sm:w-24 aspect-[2/3] group-hover:ring-white/20 transition-all">
          {item.coverImageUrl ? (
            <img
              src={item.coverImageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-600">
              <config.icon className="size-8" />
            </div>
          )}

          {/* Direct stream link overlay button */}
          <button
            type="button"
            onClick={handleLaunch}
            title={item.streamLink ? "Open stream / reader" : "Add stream link"}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer text-white"
          >
            <div className="p-2 rounded-full bg-indigo-600/90 text-white shadow-lg hover:scale-110 transition-transform">
              {item.mediaType === "book" || item.mediaType === "manga" ? (
                <ExternalLink className="size-4" />
              ) : (
                <Play className="size-4 fill-current ml-0.5" />
              )}
            </div>
          </button>
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <MediaBadge type={item.mediaType as MediaType} />
              
              {/* Card Context Menu Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <MoreVertical className="size-4" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1 z-50 text-xs space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(item);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white text-left"
                      >
                        <Edit className="size-3.5" />
                        Edit Details
                      </button>

                      <div className="h-px bg-zinc-800 my-1" />

                      <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Set Status
                      </div>

                      {item.status !== "active" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onUpdateStatus(item.id, "active");
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 text-left"
                        >
                          <Play className="size-3.5" />
                          Mark Active
                        </button>
                      )}

                      {item.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onUpdateStatus(item.id, "completed");
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 text-left"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Mark Completed
                        </button>
                      )}

                      {item.status !== "backlog" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onUpdateStatus(item.id, "backlog");
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-violet-400 hover:bg-violet-500/10 text-left"
                        >
                          <Clock className="size-3.5" />
                          Move to Backlog
                        </button>
                      )}

                      {item.status !== "hold" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onUpdateStatus(item.id, "hold");
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 text-left"
                        >
                          <PauseCircle className="size-3.5" />
                          Put on Hold
                        </button>
                      )}

                      {item.status !== "dropped" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onUpdateStatus(item.id, "dropped");
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 text-left"
                        >
                          <XCircle className="size-3.5" />
                          Drop
                        </button>
                      )}

                      <div className="h-px bg-zinc-800 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(item.id);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-left"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <h3
              onClick={() => onEdit(item)}
              className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug cursor-pointer hover:text-indigo-300 transition-colors"
              title={item.title}
            >
              {item.title}
            </h3>

            {item.rating && (
              <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
                <Star className="size-3 fill-current" />
                <span className="font-mono font-medium">{item.rating}/10</span>
              </div>
            )}
          </div>

          {/* Outbound Link Pill */}
          {item.streamLink && (
            <a
              href={item.streamLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-indigo-300 truncate max-w-full transition-colors mt-1"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">Open Stream / Source</span>
            </a>
          )}
        </div>
      </div>

      {/* Stepper & Bottom Action Bar */}
      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 space-y-2">
        <ProgressStepper
          currentProgress={item.currentProgress}
          maxProgress={item.maxProgress}
          mediaType={item.mediaType as MediaType}
          onUpdate={(newVal) => onUpdateProgress(item.id, newVal)}
        />

        {/* Quick action footer */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <StatusBadge status={item.status as MediaStatus} />

          {item.status === "backlog" ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(item.id, "active")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-all active:scale-95"
            >
              <Play className="size-3 fill-current" />
              Start
            </button>
          ) : item.status === "active" ? (
            <button
              type="button"
              onClick={handleLaunch}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium border border-zinc-700/60 transition-all active:scale-95"
            >
              {item.mediaType === "book" || item.mediaType === "manga" ? (
                <>
                  <ExternalLink className="size-3" />
                  Read
                </>
              ) : (
                <>
                  <Play className="size-3 fill-current" />
                  Watch
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
