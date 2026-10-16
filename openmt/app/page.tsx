"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Media, MediaStatus } from "@/db/schema";
import { NormalizedMediaResult } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Omnibar } from "@/components/media/Omnibar";
import { CatalogView } from "@/components/media/CatalogView";
import { PickForMeModal } from "@/components/media/PickForMeModal";
import { ScratchpadModal } from "@/components/media/ScratchpadModal";
import { ManualAddModal } from "@/components/media/ManualAddModal";
import { EditMediaModal } from "@/components/media/EditMediaModal";
import { BackupModal } from "@/components/media/BackupModal";
import { Loader2 } from "lucide-react";
import { ToastMessage, ToastViewport } from "@/components/ui/Toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

async function fetchMediaList(): Promise<Media[]> {
  const res = await fetch("/api/media");
  if (!res.ok) throw new Error("Failed to fetch media list");
  const data = await res.json();
  return data.items || [];
}

/* Sample data intentionally lives in the UI only when explicitly requested. */
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
  const router = useRouter();
  const { data: auth, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => (await fetch("/api/auth/me")).json(),
    retry: false,
  });

  if (isCheckingAuth) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f2fb] text-sm text-slate-500"><Loader2 className="mr-2 size-4 animate-spin" /> Checking your session…</div>;
  }
  if (!auth?.user) {
    router.replace("/landing");
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f2fb] text-sm text-slate-500">Redirecting…</div>;
  }
  return <Dashboard />;
}

function Dashboard() {
  const queryClient = useQueryClient();

  // Modals state
  const [isPickForMeOpen, setIsPickForMeOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Media | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notify = (text: string, tone: ToastMessage["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  };

  // Fetch Media Items
  const { data: mediaList = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: fetchMediaList,
    enabled: true,
  });

  // Optimistic Progress Mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, newProgress, partUpdate }: { id: string; newProgress: number; partUpdate?: { currentVolume?: number; currentSeason?: number } }) => {
      // Build the PATCH body — merge volume into metadata when present
      const body: Record<string, unknown> = { currentProgress: newProgress };
      if (partUpdate) {
        // We need to fetch the current item's metadata to merge safely
        const currentItem = queryClient.getQueryData<Media[]>(["media"])?.find((m) => m.id === id);
        body.metadata = {
          ...(currentItem?.metadata ?? {}),
          ...partUpdate,
        };
      }
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json();
    },
    onMutate: async ({ id, newProgress, partUpdate }) => {
      await queryClient.cancelQueries({ queryKey: ["media"] });
      const previous = queryClient.getQueryData<Media[]>(["media"]);

      queryClient.setQueryData<Media[]>(["media"], (old = []) =>
        old.map((item) => {
          if (item.id === id) {
            const isGrouped = item.mediaType === "manga" || item.mediaType === "tv";
            const isTv = item.mediaType === "tv";
            const nextVolume =
              partUpdate?.currentSeason ?? (isTv ? item.metadata?.currentSeason : partUpdate?.currentVolume ?? item.metadata?.currentVolume) ?? 1;
            const maxVolumes = isTv ? item.metadata?.maxSeasons : item.metadata?.maxVolumes;

            let isCompleted = false;
            if (isGrouped) {
              isCompleted = Boolean(
                maxVolumes &&
                  maxVolumes > 0 &&
                  nextVolume >= maxVolumes &&
                  item.maxProgress &&
                  item.maxProgress > 0 &&
                  newProgress >= item.maxProgress
              );
            } else {
              isCompleted = Boolean(
                item.maxProgress &&
                  item.maxProgress > 0 &&
                  newProgress >= item.maxProgress
              );
            }

            const newStatus = isCompleted
              ? "completed"
              : item.status === "backlog" &&
                (newProgress > 0 || (isGrouped && nextVolume > 1))
              ? "active"
              : item.status;

            return {
              ...item,
              currentProgress: newProgress,
              status: newStatus,
              metadata: partUpdate
                ? { ...(item.metadata ?? {}), ...partUpdate }
                : item.metadata,
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
      notify("Progress could not be saved. Your change was reverted.", "error");
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
      notify("Status could not be saved. Your change was reverted.", "error");
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
      notify("Delete failed. Your item was restored.", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  // Omnibar Add Handler
  const handleAddMedia = async (
    item: NormalizedMediaResult,
    status: "active" | "backlog" | "completed"
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
      if (res.status === 409) throw new Error("That title is already in your library.");
      throw new Error("Failed to add media");
    }

    queryClient.invalidateQueries({ queryKey: ["media"] });
    notify(`${item.title} added to your library.`);
  };

  return (
    <div className="min-h-screen flex flex-col surface content selection:bg-violet-200 selection:text-slate-800 pb-20">
      {/* Top Navbar */}
      <Navbar
        onOpenPickForMe={() => setIsPickForMeOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onOpenManualAdd={() => setIsManualAddOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Omnibar Section */}
        <section className="space-y-3 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
              What are we reading or watching next?
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Search AniList, TV shows, movies, and books to add to your queue with zero friction.
            </p>
          </div>

          <Omnibar
            onAddMedia={handleAddMedia}
            localMedia={mediaList}
            onUpdateStatus={async (id, status) => {
              await updateStatusMutation.mutateAsync({ id, newStatus: status });
            }}
            onOpenManualAdd={() => setIsManualAddOpen(true)}
          />
        </section>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="size-8 animate-spin text-indigo-400" />
            <span className="text-xs">Loading media collection...</span>
          </div>
        )}

        {/* Catalog & Backlog Section */}
        {!isLoading && mediaList.length === 0 ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-violet-200 bg-white/80 p-8 text-center shadow-xl shadow-violet-100/70">
            <h2 className="text-lg font-bold text-white">Build your personal media shelf</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">Search above to add anime, manga, shows, movies, or books. You can also start with a custom entry if it is not in one of the external catalogs.</p>
            <button type="button" onClick={() => setIsManualAddOpen(true)} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500">Add your first item manually</button>
          </section>
        ) : !isLoading && (
          <CatalogView
            items={mediaList}
            onUpdateProgress={(id, newProg, volumeUpdate) =>
              updateProgressMutation.mutate({ id, newProgress: newProg, partUpdate: volumeUpdate })
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
      <ToastViewport messages={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    </div>
  );
}

export function LandingPage() {
  return <main className="min-h-screen overflow-hidden bg-[#f4f2fb] text-slate-700">
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-8">
      <nav className="flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-2 text-lg font-extrabold text-slate-800"><span className="flex size-9 items-center justify-center rounded-2xl bg-violet-300 text-violet-900">✦</span> OpenMT</Link>
        <div className="flex items-center gap-3"><Link href="/login" className="rounded-xl px-4 py-2 text-sm text-zinc-300 hover:text-white">Log in</Link><Link href="/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500">Get started</Link></div>
      </nav>
      <section className="flex flex-1 items-center py-20"><div className="max-w-3xl"><p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-violet-500">Your personal media command center</p><h1 className="text-5xl font-black tracking-tight text-slate-800 sm:text-7xl">Know what to watch, read, and finish next.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">OpenMT brings anime, manga, TV, movies, and books into one calm, searchable shelf—so your next choice is easy and your progress never gets lost.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/signup" className="rounded-2xl bg-violet-400 px-6 py-3 text-sm font-bold text-violet-950 shadow-lg shadow-violet-200 hover:bg-violet-300">Create your free account</Link><Link href="/login" className="rounded-2xl border border-violet-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-white">I already have an account</Link></div></div></section>
      <section className="grid gap-4 border-t border-zinc-800 pt-8 text-sm text-zinc-400 sm:grid-cols-3"><div><p className="font-semibold text-white">One unified shelf</p><p className="mt-1">Track every format in one place.</p></div><div><p className="font-semibold text-white">Less decision fatigue</p><p className="mt-1">Use Pick For Me when choosing feels hard.</p></div><div><p className="font-semibold text-white">Private by default</p><p className="mt-1">Your library belongs to your account.</p></div></section>
    </div>
  </main>;
}
