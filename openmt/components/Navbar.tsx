import React from "react";
import {
  Sparkles,
  Dice5,
  FileText,
  Plus,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

interface NavbarProps {
  stats: {
    total: number;
    active: number;
    backlog: number;
    completed: number;
  };
  onOpenPickForMe: () => void;
  onOpenScratchpad: () => void;
  onOpenManualAdd: () => void;
  onOpenBackup: () => void;
}

export function Navbar({
  stats,
  onOpenPickForMe: onPickForMe,
  onOpenScratchpad: onScratchpad,
  onOpenManualAdd: onManualAdd,
  onOpenBackup: onBackup,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25">
            <Layers className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                OpenMT
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hub & Engine
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Unified Personal Media & Decision Engine
            </p>
          </div>
        </div>

        {/* Quick Stats Badges (Hidden on very small screens) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Flame className="size-3.5 text-emerald-400" />
            <span className="font-semibold text-white">{stats.active}</span>
            <span className="text-zinc-500">Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Clock className="size-3.5 text-violet-400" />
            <span className="font-semibold text-white">{stats.backlog}</span>
            <span className="text-zinc-500">Backlog</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <CheckCircle2 className="size-3.5 text-blue-400" />
            <span className="font-semibold text-white">{stats.completed}</span>
            <span className="text-zinc-500">Done</span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {/* Decision Engine Pick Button */}
          <button
            type="button"
            onClick={onPickForMe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Dice5 className="size-4" />
            <span className="hidden sm:inline">Pick For Me</span>
          </button>

          {/* Scratchpad */}
          <button
            type="button"
            onClick={onScratchpad}
            title="Bulk import from notes"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="size-3.5" />
            <span className="hidden lg:inline">Scratchpad</span>
          </button>

          {/* Manual Custom Add */}
          <button
            type="button"
            onClick={onManualAdd}
            title="Add custom item manually"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span className="hidden lg:inline">Add Custom</span>
          </button>

          {/* Backup / Export */}
          <button
            type="button"
            onClick={onBackup}
            title="Database backup and restore"
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <Download className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
