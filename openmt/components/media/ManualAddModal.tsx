import React, { useState } from "react";
import { MediaType, MediaStatus } from "@/db/schema";
import { Plus, Loader2, X, Sparkles } from "lucide-react";

interface ManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess: () => void;
}

export function ManualAddModal({
  isOpen,
  onClose,
  onAddSuccess,
}: ManualAddModalProps) {
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("anime");
  const [status, setStatus] = useState<MediaStatus>("backlog");
  const [currentProgress, setCurrentProgress] = useState("0");
  const [maxProgress, setMaxProgress] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [streamLink, setStreamLink] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genres, setGenres] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedCurrent = parseInt(currentProgress, 10) || 0;
      const parsedMax = maxProgress ? parseInt(maxProgress, 10) : null;
      const parsedGenres = genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          mediaType,
          status,
          currentProgress: parsedCurrent,
          maxProgress: parsedMax,
          coverImageUrl: coverImageUrl.trim() || null,
          streamLink: streamLink.trim() || null,
          genres: parsedGenres,
          metadata: synopsis ? { synopsis } : {},
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create media item.");
      }

      onAddSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create media.");
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
              <Plus className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Custom Media</h3>
              <p className="text-xs text-zinc-400">
                Manually log indie manga, webnovels, local media, or custom books
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Omniscient Reader's Viewpoint"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Medium Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
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
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MediaStatus)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="backlog">Backlog</option>
                <option value="active">In Progress (Active)</option>
                <option value="completed">Completed</option>
                <option value="hold">On Hold</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Current Progress
              </label>
              <input
                type="number"
                min={0}
                value={currentProgress}
                onChange={(e) => setCurrentProgress(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Total Max Progress (Optional)
              </label>
              <input
                type="number"
                min={1}
                value={maxProgress}
                onChange={(e) => setMaxProgress(e.target.value)}
                placeholder="e.g. 24 episodes or 350 pages"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Direct Stream / Reader URL
              </label>
              <input
                type="text"
                value={streamLink}
                onChange={(e) => setStreamLink(e.target.value)}
                placeholder="https://... or crunchyroll://"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Genres (comma-separated)
            </label>
            <input
              type="text"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              placeholder="Action, Fantasy, Sci-Fi"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              <span>Create Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
