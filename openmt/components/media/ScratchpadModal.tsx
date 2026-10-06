import React, { useState } from "react";
import { MediaType, MediaStatus } from "@/db/schema";
import { FileText, Loader2, X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkImportSuccess: () => void;
}

export function ScratchpadModal({
  isOpen,
  onClose,
  onBulkImportSuccess,
}: ScratchpadModalProps) {
  const [rawText, setRawText] = useState("");
  const [defaultMediaType, setDefaultMediaType] = useState<MediaType>("anime");
  const [defaultStatus, setDefaultStatus] = useState<MediaStatus>("backlog");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedLines = rawText
    .split("\n")
    .map((l) => l.trim().replace(/^[-*•\d+.]\s*/, "")) // remove leading bullet points or numbers
    .filter((l) => l.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedLines.length === 0) {
      setError("Please enter at least one title.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const itemsToInsert = parsedLines.map((title) => ({
        title,
        mediaType: defaultMediaType,
        status: defaultStatus,
        currentProgress: 0,
        tags: ["scratchpad-import"],
      }));

      const res = await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToInsert }),
      });

      if (!res.ok) {
        throw new Error("Bulk import failed.");
      }

      setRawText("");
      onBulkImportSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to import items.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scratchpad Bulk Importer</h3>
              <p className="text-xs text-zinc-400">
                Paste raw list from phone notes or bookmarks (one title per line)
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Default Medium Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Default Medium
              </label>
              <select
                value={defaultMediaType}
                onChange={(e) => setDefaultMediaType(e.target.value as MediaType)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="anime">Anime</option>
                <option value="manga">Manga</option>
                <option value="tv">TV Show</option>
                <option value="movie">Movie</option>
                <option value="book">Book</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Initial Status
              </label>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value as MediaStatus)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="backlog">Backlog</option>
                <option value="active">Active (In Progress)</option>
              </select>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Titles List (One per line)
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Frieren: Beyond Journey's End&#10;Dune: Part Two&#10;Solo Leveling&#10;Project Hail Mary"
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-2xl p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-400">
              {parsedLines.length} item{parsedLines.length === 1 ? "" : "s"} detected
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || parsedLines.length === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                <span>Import {parsedLines.length} Items</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
