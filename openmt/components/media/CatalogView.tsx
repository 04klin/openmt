import React, { useState, useMemo } from "react";
import { Media, MediaType, MediaStatus } from "@/db/schema";
import { MediaCard } from "./MediaCard";
import { Search, SlidersHorizontal, Layers, Sparkles, X } from "lucide-react";
import Fuse from "fuse.js";
import { cn } from "@/lib/utils";

interface CatalogViewProps {
  items: Media[];
  onUpdateProgress: (id: string, newProgress: number) => void;
  onUpdateStatus: (id: string, newStatus: MediaStatus) => void;
  onEdit: (item: Media) => void;
  onDelete: (id: string) => void;
  onOpenManualAdd: () => void;
}

type SortOption = "created" | "updated" | "title" | "progress" | "rating";

const STATUS_TABS: { label: string; value: "all" | MediaStatus }[] = [
  { label: "All Items", value: "all" },
  { label: "Backlog", value: "backlog" },
  { label: "In Progress", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "On Hold", value: "hold" },
  { label: "Dropped", value: "dropped" },
];

const MEDIUM_PILLS: { label: string; value: "all" | MediaType }[] = [
  { label: "All Types", value: "all" },
  { label: "Anime", value: "anime" },
  { label: "Manga", value: "manga" },
  { label: "TV Shows", value: "tv" },
  { label: "Movies", value: "movie" },
  { label: "Books", value: "book" },
];

export function CatalogView({
  items,
  onUpdateProgress,
  onUpdateStatus,
  onEdit,
  onDelete,
  onOpenManualAdd,
}: CatalogViewProps) {
  const [activeStatus, setActiveStatus] = useState<"all" | MediaStatus>("all");
  const [activeMedium, setActiveMedium] = useState<"all" | MediaType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created");

  // Initialize Fuse.js for ultra-fast typo-tolerant fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: "title", weight: 0.5 },
        { name: "genres", weight: 0.2 },
        { name: "tags", weight: 0.2 },
        { name: "mediaType", weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply fuzzy search if query exists
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery.trim());
      result = searchResults.map((r) => r.item);
    }

    // Apply Status filter
    if (activeStatus !== "all") {
      result = result.filter((item) => item.status === activeStatus);
    }

    // Apply Medium filter
    if (activeMedium !== "all") {
      result = result.filter((item) => item.mediaType === activeMedium);
    }

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "progress") {
        const pctA = a.maxProgress && a.maxProgress > 0 ? a.currentProgress / a.maxProgress : 0;
        const pctB = b.maxProgress && b.maxProgress > 0 ? b.currentProgress / b.maxProgress : 0;
        return pctB - pctA;
      }
      if (sortBy === "updated") {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      }
      // default: created (Stable order)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [items, searchQuery, activeStatus, activeMedium, sortBy, fuse]);

  return (
    <section className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
              <Layers className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Media Catalog & Backlog
                <span className="text-xs font-mono text-zinc-400">
                  ({filteredItems.length} {filteredItems.length === 1 ? "item" : "items"})
                </span>
              </h2>
            </div>
          </div>

          {/* Search bar inside catalog */}
          <div className="relative flex items-center w-full sm:w-64">
            <Search className="absolute left-3 size-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fuzzy search catalog..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-zinc-400 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800/80">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === "all"
                ? items.length
                : items.filter((i) => i.status === tab.value).length;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveStatus(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-all cursor-pointer",
                  activeStatus === tab.value
                    ? "border-indigo-500 text-white font-semibold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    activeStatus === tab.value
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Medium Pills & Sort Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Medium Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {MEDIUM_PILLS.map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setActiveMedium(pill.value)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  activeMedium === pill.value
                    ? "bg-zinc-700 text-white shadow-sm ring-1 ring-white/10"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] text-zinc-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="created">Date Added (Newest)</option>
              <option value="updated">Recently Updated</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="progress">Completion %</option>
              <option value="rating">Rating (Highest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              variant="grid"
              onUpdateProgress={onUpdateProgress}
              onUpdateStatus={onUpdateStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400 mb-3">
            <Sparkles className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            No media matching your filters
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            Try clearing the search query, adjusting medium filters, or adding a new title.
          </p>
          <button
            type="button"
            onClick={onOpenManualAdd}
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-all cursor-pointer"
          >
            Add New Media
          </button>
        </div>
      )}
    </section>
  );
}
