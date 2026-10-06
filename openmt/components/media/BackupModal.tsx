import React, { useState } from "react";
import { Download, Upload, Loader2, X, Check, FileJson } from "lucide-react";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export function BackupModal({
  isOpen,
  onClose,
  onImportSuccess,
}: BackupModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    window.location.href = "/api/media/export";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setImportStatus(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch("/api/media/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        throw new Error("Failed to import backup file.");
      }

      const result = await res.json();
      setImportStatus(`Successfully restored ${result.count || 0} items!`);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to process backup file.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileJson className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Data Portability</h3>
              <p className="text-xs text-zinc-400">Export or restore your media hub database</p>
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

        <div className="mt-5 space-y-4">
          {/* Export section */}
          <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Download Backup</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Export all items, progress, tags, and links as a JSON file.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0 transition-all active:scale-95"
            >
              <Download className="size-3.5" />
              Export
            </button>
          </div>

          {/* Import section */}
          <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-white">Restore from Backup</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Upload a previously exported JSON backup file.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zinc-600 hover:border-indigo-400 bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-pointer text-center">
              <Upload className="size-5 text-indigo-400 mb-1" />
              <span className="text-xs font-medium text-zinc-200">
                {isImporting ? "Processing JSON..." : "Click to select .json backup file"}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                JSON files only
              </span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="size-4" />
              <span>{importStatus}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
