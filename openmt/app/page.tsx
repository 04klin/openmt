"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Media, MediaStatus, MediaType } from "@/db/schema";
import { NormalizedMediaResult } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Omnibar } from "@/components/media/Omnibar";
import { ActiveShelf } from "@/components/media/ActiveShelf";
import { CatalogView } from "@/components/media/CatalogView";
import { PickForMeModal } from "@/components/media/PickForMeModal";
import { ScratchpadModal } from "@/components/media/ScratchpadModal";
import { ManualAddModal } from "@/components/media/ManualAddModal";
import { EditMediaModal } from "@/components/media/EditMediaModal";
import { BackupModal } from "@/components/media/BackupModal";
import { Sparkles, Loader2, Plus, Dice5 } from "lucide-react";

async function fetchMediaList(): Promise<Media[]> {
  const res = await fetch("/api/media");
  if (!res.ok) throw new Error("Failed to fetch media list");
  const data = await res.json();
  return data.items || [];
}

const SAMPLE_STARTER_DATA = [
  {
    title: "Frieren: Beyond Journey's End",
    mediaType: "anime" as const,
    status: "active" as const,
    currentProgress: 14,
    maxProgress: 28,
    coverImageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n2bGQMykhhrn.jpg",
    streamLink: "https://www.crunchyroll.com/series/GG5H5XMQ5/frieren-beyond-journeys-end",
    rating: 10,
    genres: ["Adventure", "Drama", "Fantasy"],
    metadata: { synopsis: "The adventure is over but life goes on for an elf mage just beginning to learn what living is all about." },
  },
  {
    title: "Chainsaw Man (Manga)",
    mediaType: "manga" as const,
    status: "active" as const,
    currentProgress: 42,
    maxProgress: 175,
    coverImageUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-5eJ30n7l2aU3.png",
    streamLink: "https://mangadex.org/title/a7774250-8070-4231-9236-b60d7ae560e2/chainsaw-man",
    rating: 9,
    genres: ["Action", "Supernatural", "Horror"],
    metadata: { synopsis: "Denji's life changes forever when he merges with his pet devil Pochita." },
  },
  {
    title: "Severance",
    mediaType: "tv" as const,
    status: "active" as const,
    currentProgress: 6,
    maxProgress: 9,
    coverImageUrl: "https://static.tvmaze.com/uploads/images/original_untouched/444/1110023.jpg",
    streamLink: "https://tv.apple.com/show/severance",
    rating: 9,
    genres: ["Drama", "Sci-Fi", "Thriller"],
    metadata: { synopsis: "Mark leads a team of office workers whose memories have been surgically divided." },
  },
  {
    title: "Dune: Part Two",
    mediaType: "movie" as const,
    status: "backlog" as const,
    currentProgress: 0,
    maxProgress: 166,
    coverImageUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    genres: ["Sci-Fi", "Adventure"],
    metadata: { synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators." },
  },
  {
    title: "Project Hail Mary",
    mediaType: "book" as const,
    status: "backlog" as const,
    currentProgress: 0,
    maxProgress: 496,
    coverImageUrl: "https://books.google.com/books/content?id=0s8zEAAAQBAJ&printsec=frontcover&img=1&zoom=1",
    genres: ["Science Fiction", "Thriller"],
    metadata: { synopsis: "A lone astronaut must save the earth from disaster in this masterwork of science fiction." },
  },
  {
    title: "Dungeon Meshi",
    mediaType: "anime" as const,
    status: "completed" as const,
    currentProgress: 24,
    maxProgress: 24,
    coverImageUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153518-iOa04kK3qHlq.jpg",
    streamLink: "https://www.netflix.com/title/81564899",
    rating: 9,
    genres: ["Adventure", "Comedy", "Fantasy"],
  },
];

export default function Home() {
  const queryClient = useQueryClient();

  // Modals state
  const [isPickForMeOpen, setIsPickForMeOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Media | null>(null);

  // Fetch Media Items
  const { data: mediaList = [], isLoading, refetch } = useQuery({
    queryKey: ["media"],
    queryFn: fetchMediaList,
  });

  // Optimistic Progress Mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, newProgress }: { id: string; newProgress: number }) => {
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProgress: newProgress }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json();
    },
    onMutate: async ({ id, newProgress }) => {
      await queryClient.cancelQueries({ queryKey: ["media"] });
      const previous = queryClient.getQueryData<Media[]>(["media"]);

      queryClient.setQueryData<Media[]>(["media"], (old = []) =>
        old.map((item) => {
          if (item.id === id) {
            const isCompleted =
              item.maxProgress && item.maxProgress > 0 && newProgress >= item.maxProgress;
            return {
              ...item,
              currentProgress: newProgress,
              status: isCompleted ? "completed" : item.status === "backlog" && newProgress > 0 ? "active" : item.status,
              updatedAt: new Date(),
            };
          }
          return item;
        })
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["media"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: MediaStatus }) => {
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onMutate: async ({ id, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["media"] });
      const previous = queryClient.getQueryData<Media[]>(["media"]);

      queryClient.setQueryData<Media[]>(["media"], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["media"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete media");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["media"] });
      const previous = queryClient.getQueryData<Media[]>(["media"]);
      queryClient.setQueryData<Media[]>(["media"], (old = []) =>
        old.filter((item) => item.id !== id)
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["media"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  // Omnibar Add Handler
  const handleAddMedia = async (
    item: NormalizedMediaResult,
    status: "active" | "backlog"
  ) => {
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        mediaType: item.mediaType,
        status,
        currentProgress: 0,
        maxProgress: item.maxProgress,
        coverImageUrl: item.coverImageUrl,
        streamLink: item.streamLink,
        genres: item.genres,
        metadata: {
          ...item.metadata,
          synopsis: item.synopsis,
          creators: item.creators,
          year: item.year,
        },
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to add media");
    }

    queryClient.invalidateQueries({ queryKey: ["media"] });
  };

  // Seed sample data
  const handleSeedSamples = async () => {
    try {
      await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: SAMPLE_STARTER_DATA }),
      });
      queryClient.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      console.error("Seed error:", e);
    }
  };

  const activeItems = React.useMemo(() => {
    return mediaList
      .filter((m) => m.status === "active")
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeA - timeB;
      });
  }, [mediaList]);

  const backlogItems = React.useMemo(() => {
    return mediaList.filter((m) => m.status === "backlog");
  }, [mediaList]);

  const completedItems = React.useMemo(() => {
    return mediaList.filter((m) => m.status === "completed");
  }, [mediaList]);

  const stats = {
    total: mediaList.length,
    active: activeItems.length,
    backlog: backlogItems.length,
    completed: completedItems.length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        onOpenPickForMe={() => setIsPickForMeOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onOpenManualAdd={() => setIsManualAddOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Omnibar Section */}
        <section className="space-y-3 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              What are we reading or watching next?
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Search AniList, TV shows, movies, and books to add to your queue with zero friction.
            </p>
          </div>

          <Omnibar
            onAddMedia={handleAddMedia}
            onOpenManualAdd={() => setIsManualAddOpen(true)}
          />
        </section>

        {/* Empty state with Quick Seed if catalog is empty */}
        {!isLoading && mediaList.length === 0 && (
          <div className="max-w-xl mx-auto rounded-3xl bg-zinc-900/60 border border-zinc-800 p-8 text-center space-y-4 shadow-xl">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="size-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Welcome to OpenMT!
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your unified personal media tracker is ready. You can search above to add your favorite titles, or load a sample starter catalog to try out the decision engine and steppers immediately.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeedSamples}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="size-3.5" />
                Load Sample Starter Catalog
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="size-8 animate-spin text-indigo-400" />
            <span className="text-xs">Loading media collection...</span>
          </div>
        )}

        {/* Currently Consuming Shelf */}
        {!isLoading && mediaList.length > 0 && (
          <ActiveShelf
            items={activeItems}
            onUpdateProgress={(id, newProg) =>
              updateProgressMutation.mutate({ id, newProgress: newProg })
            }
            onUpdateStatus={(id, newStatus) =>
              updateStatusMutation.mutate({ id, newStatus })
            }
            onEdit={(item) => setEditingItem(item)}
            onDelete={(id) => deleteMutation.mutate(id)}
            onOpenPickForMe={() => setIsPickForMeOpen(true)}
          />
        )}

        {/* Catalog & Backlog Section */}
        {!isLoading && mediaList.length > 0 && (
          <CatalogView
            items={mediaList}
            onUpdateProgress={(id, newProg) =>
              updateProgressMutation.mutate({ id, newProgress: newProg })
            }
            onUpdateStatus={(id, newStatus) =>
              updateStatusMutation.mutate({ id, newStatus })
            }
            onEdit={(item) => setEditingItem(item)}
            onDelete={(id) => deleteMutation.mutate(id)}
            onOpenManualAdd={() => setIsManualAddOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <PickForMeModal
        isOpen={isPickForMeOpen}
        onClose={() => setIsPickForMeOpen(false)}
        mediaPool={mediaList}
        onStartConsuming={(id) => updateStatusMutation.mutate({ id, newStatus: "active" })}
      />

      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        onBulkImportSuccess={() => queryClient.invalidateQueries({ queryKey: ["media"] })}
      />

      <ManualAddModal
        isOpen={isManualAddOpen}
        onClose={() => setIsManualAddOpen(false)}
        onAddSuccess={() => queryClient.invalidateQueries({ queryKey: ["media"] })}
      />

      <EditMediaModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onUpdateSuccess={() => queryClient.invalidateQueries({ queryKey: ["media"] })}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ["media"] })}
      />
    </div>
  );
}
