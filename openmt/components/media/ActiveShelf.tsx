import React from "react";
import { Media, MediaType, MediaStatus } from "@/db/schema";
import { MediaCard } from "./MediaCard";
import { Flame, Sparkles, Plus } from "lucide-react";

interface ActiveShelfProps {
  items: Media[];
  onUpdateProgress: (id: string, newProgress: number, volumeUpdate?: { currentVolume: number }) => void;
  onUpdateStatus: (id: string, newStatus: MediaStatus) => void;
  onEdit: (item: Media) => void;
  onDelete: (id: string) => void;
  onOpenPickForMe: () => void;
}

export function ActiveShelf({
  items,
  onUpdateProgress,
  onUpdateStatus,
  onEdit,
  onDelete,
  onOpenPickForMe,
}: ActiveShelfProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center backdrop-blur-md">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
          <Flame className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">
          Nothing in your Active Shelf right now
        </h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
          Start watching or reading something from your backlog, or use the Decision Engine to pick for you.
        </p>
        <button
          type="button"
          onClick={onOpenPickForMe}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          Pick something for me!
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
            <Flame className="size-4 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Currently Consuming
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {items.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Your active queue across books, manga, anime, and shows
            </p>
          </div>
        </div>
      </div>

      {/* Active Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            variant="active"
            onUpdateProgress={onUpdateProgress}
            onUpdateStatus={onUpdateStatus}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
