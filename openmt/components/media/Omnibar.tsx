import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Plus, Play, Sparkles, X, ExternalLink } from "lucide-react";
import { MediaType } from "@/db/schema";
import { NormalizedMediaResult } from "@/lib/types";
import { MediaBadge } from "./MediaBadge";
import { cn } from "@/lib/utils";

interface OmnibarProps {
  onAddMedia: (item: NormalizedMediaResult, status: "active" | "backlog") => Promise<void>;
  onOpenManualAdd: () => void;
}

const CATEGORIES: { label: string; value: MediaType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Anime", value: "anime" },
  { label: "Manga", value: "manga" },
  { label: "TV", value: "tv" },
  { label: "Movie", value: "movie" },
  { label: "Books", value: "book" },
];

export function Omnibar({ onAddMedia, onOpenManualAdd }: OmnibarProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MediaType | "all">("all");
  const [results, setResults] = useState<NormalizedMediaResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&type=${selectedType}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Omnibar search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, selectedType]);

  const handleAdd = async (item: NormalizedMediaResult, status: "active" | "backlog") => {
    setAddingId(item.id + status);
    try {
      await onAddMedia(item, status);
      // Optional: keep search open or clear query
      setIsOpen(false);
      setQuery("");
    } catch (e) {
      console.error("Failed to add item:", e);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto z-40">
      {/* Search Bar Container */}
      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/70 shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 px-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedType(cat.value)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                selectedType === cat.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="relative flex-1 flex items-center min-w-0">
          <Search className="absolute left-3 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search anime, books, manga, TV shows, movies..."
            className="w-full pl-9 pr-8 py-2 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          {isLoading ? (
            <Loader2 className="absolute right-3 size-4 text-indigo-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
              }}
              className="absolute right-3 text-zinc-400 hover:text-zinc-200"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl glass-dropdown shadow-2xl p-2 z-50 border border-zinc-700/80 animate-in fade-in-0 zoom-in-95 duration-150">
          {results.length > 0 ? (
            <div className="space-y-1.5">
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-zinc-400 border-b border-zinc-800/80 mb-1">
                <span>Search Suggestions ({results.length})</span>
                <span className="text-[10px] text-zinc-500">Auto-resolved metadata</span>
              </div>

              {results.map((item) => {
                const isAddingActive = addingId === item.id + "active";
                const isAddingBacklog = addingId === item.id + "backlog";

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/60 transition-all"
                  >
                    {/* Media Thumbnail & Details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="size-14 sm:size-16 rounded-lg object-cover bg-zinc-800 ring-1 ring-white/10 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-14 sm:size-16 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                          <Sparkles className="size-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <MediaBadge type={item.mediaType} />
                          {item.year && (
                            <span className="text-xs text-zinc-400 font-mono">
                              ({item.year})
                            </span>
                          )}
                          {item.maxProgress && (
                            <span className="text-xs text-zinc-400 font-mono bg-zinc-800/80 px-1.5 py-0.2 rounded border border-zinc-700/40">
                              {item.maxProgress} {item.progressUnit}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h4>

                        {item.creators && item.creators.length > 0 && (
                          <p className="text-xs text-zinc-400 truncate">
                            {item.creators.slice(0, 2).join(", ")}
                          </p>
                        )}

                        {item.synopsis && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {item.synopsis}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={Boolean(addingId)}
                        onClick={() => handleAdd(item, "backlog")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isAddingBacklog ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Plus className="size-3.5" />
                        )}
                        <span>Backlog</span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(addingId)}
                        onClick={() => handleAdd(item, "active")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isAddingActive ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Play className="size-3.5 fill-current" />
                        )}
                        <span>Start Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !isLoading ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm text-zinc-400">
                No matching media found for &ldquo;<span className="text-zinc-200">{query}</span>&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenManualAdd();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
              >
                <Plus className="size-3.5" />
                Add custom media manually
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
