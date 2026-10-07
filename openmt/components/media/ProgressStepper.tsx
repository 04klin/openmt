import React, { useState, useEffect } from "react";
import { MediaType } from "@/db/schema";
import { MEDIA_TYPE_CONFIG } from "./MediaBadge";
import { Plus, Minus, Check, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStepperProps {
  currentProgress: number;
  maxProgress?: number | null;
  mediaType: MediaType;
  onUpdate: (newProgress: number, volumeUpdate?: { currentVolume: number }) => void;
  disabled?: boolean;
  compact?: boolean;
  // Manga-specific volume props
  currentVolume?: number;
  maxVolumes?: number | null;
}

export function ProgressStepper({
  currentProgress,
  maxProgress,
  mediaType,
  onUpdate,
  disabled = false,
  compact = false,
  currentVolume,
  maxVolumes,
}: ProgressStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(currentProgress.toString());
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(currentProgress);

  // Volume edit state (manga only)
  const [isEditingVolume, setIsEditingVolume] = useState(false);
  const [tempVolumeValue, setTempVolumeValue] = useState(
    (currentVolume ?? 1).toString()
  );

  const isManga = mediaType === "manga";
  const showVolumes = isManga;

  // Sync dragValue when currentProgress changes from external updates while not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragValue(currentProgress);
      setTempValue(currentProgress.toString());
    }
  }, [currentProgress, isDragging]);

  useEffect(() => {
    setTempVolumeValue((currentVolume ?? 1).toString());
  }, [currentVolume]);

  const config = MEDIA_TYPE_CONFIG[mediaType] || MEDIA_TYPE_CONFIG.anime;
  const unit = config.unitName;

  const displayProgress = isDragging ? dragValue : currentProgress;

  const percentage =
    maxProgress && maxProgress > 0
      ? Math.min(100, Math.round((displayProgress / maxProgress) * 100))
      : 0;

  // Volume percentage for manga
  const volCurrent = currentVolume ?? 1;
  const volumePercentage =
    maxVolumes && maxVolumes > 0
      ? Math.min(100, Math.round((volCurrent / maxVolumes) * 100))
      : 0;

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    if (isManga && currentProgress <= 1) {
      // If we're at chapter 1 (or 0) and volume > 1, go down a volume
      if (volCurrent > 1) {
        onUpdate(maxProgress ?? currentProgress, { currentVolume: volCurrent - 1 });
      }
      return;
    }

    if (currentProgress > 0) {
      onUpdate(currentProgress - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    updateChapterProgress(currentProgress + 1);
  };

  /**
   * Finishing a non-final manga volume immediately starts the next one.
   * The final volume remains at its last chapter so the lifecycle can become
   * completed. Other media simply retain their normal progress behaviour.
   */
  const updateChapterProgress = (nextProgress: number) => {
    if (
      isManga &&
      maxProgress &&
      maxProgress > 0 &&
      nextProgress >= maxProgress &&
      (!maxVolumes || volCurrent < maxVolumes)
    ) {
      onUpdate(1, { currentVolume: volCurrent + 1 });
      return;
    }

    const cappedProgress =
      maxProgress && maxProgress > 0
        ? Math.min(nextProgress, maxProgress)
        : nextProgress;
    onUpdate(cappedProgress);
  };

  const handleCommitEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(tempValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      updateChapterProgress(parsed);
    } else {
      setTempValue(currentProgress.toString());
    }
    setIsEditing(false);
  };

  const handleCommitVolumeEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(tempVolumeValue, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      const finalVol = maxVolumes ? Math.min(parsed, maxVolumes) : parsed;
      // Pass volume change without changing chapter progress
      onUpdate(currentProgress, { currentVolume: finalVol });
    } else {
      setTempVolumeValue((currentVolume ?? 1).toString());
    }
    setIsEditingVolume(false);
  };

  const handleVolumeDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (volCurrent > 1) {
      onUpdate(currentProgress, { currentVolume: volCurrent - 1 });
    }
  };

  const handleVolumeIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (maxVolumes && volCurrent >= maxVolumes) return;
    onUpdate(currentProgress, { currentVolume: volCurrent + 1 });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setDragValue(val);
  };

  const handleSliderCommit = () => {
    setIsDragging(false);
    if (dragValue !== currentProgress) {
      updateChapterProgress(dragValue);
    }
  };

  return (
    <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
      {/* ── Volume Row (manga only) ── */}
      {showVolumes && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            {/* Volume badge / editor */}
            {isEditingVolume ? (
              <form
                onSubmit={handleCommitVolumeEdit}
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="number"
                  min={1}
                  max={maxVolumes || 99999}
                  value={tempVolumeValue}
                  onChange={(e) => setTempVolumeValue(e.target.value)}
                  onBlur={() => handleCommitVolumeEdit()}
                  autoFocus
                  className="w-12 rounded bg-zinc-800 border border-zinc-600 px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <span className="text-zinc-400">
                  {maxVolumes ? `/ ${maxVolumes} vols` : "vol"}
                </span>
                <button type="submit" className="p-1 text-emerald-400 hover:text-emerald-300 rounded">
                  <Check className="size-3" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTempVolumeValue((currentVolume ?? 1).toString());
                  setIsEditingVolume(true);
                }}
                title="Click to jump to specific volume"
                className="group/vol flex items-center gap-1 font-mono font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <BookOpen className="size-3 text-violet-400 shrink-0" />
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded border transition-all",
                    "bg-violet-900/30 group-hover/vol:bg-violet-800/40 border-violet-700/40 text-violet-200"
                  )}
                >
                  Vol {volCurrent}
                </span>
                <span className="text-zinc-400">
                  {maxVolumes ? `/ ${maxVolumes}` : ""}
                </span>
                {maxVolumes && volCurrent >= maxVolumes && (
                  <span className="text-violet-300 font-sans font-semibold text-[10px] ml-1">
                    FINAL VOLUME
                  </span>
                )}
              </button>
            )}

            {/* Volume stepper buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleVolumeDecrement}
                disabled={disabled || volCurrent <= 1}
                aria-label="Decrease volume"
                className={cn(
                  "flex items-center justify-center rounded bg-zinc-800/90 text-violet-300 hover:bg-violet-800/50 hover:text-violet-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-violet-700/30 active:scale-95",
                  compact ? "size-6" : "size-7"
                )}
              >
                <Minus className={compact ? "size-3" : "size-3.5"} />
              </button>
              <button
                type="button"
                onClick={handleVolumeIncrement}
                disabled={disabled || (Boolean(maxVolumes) && volCurrent >= (maxVolumes || 0))}
                aria-label="Increase volume"
                className={cn(
                  "flex items-center justify-center rounded bg-zinc-800/90 text-violet-300 hover:bg-violet-800/50 hover:text-violet-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-violet-700/30 active:scale-95 font-bold",
                  compact ? "size-6" : "size-7"
                )}
              >
                <Plus className={compact ? "size-3" : "size-3.5"} />
              </button>
            </div>
          </div>

          {/* Volume progress bar */}
          {maxVolumes && maxVolumes > 0 ? (
            <div className="w-full bg-zinc-800/60 rounded-full h-1 overflow-hidden ring-1 ring-white/5">
              <div
                className={cn(
                  "h-full transition-[width] ease-out rounded-full",
                  volumePercentage >= 100
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "bg-gradient-to-r from-violet-500 to-fuchsia-400 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                )}
                style={{ width: `${volumePercentage}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-zinc-800/60 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-violet-500/30 w-full animate-pulse" />
            </div>
          )}

          {/* Divider between volume and chapter rows */}
          <div className="h-px bg-zinc-800/60 mt-0.5" />
        </div>
      )}

      {/* ── Chapter / Episode / Progress Row ── */}
      <div className="flex items-center justify-between text-xs">
        {/* Click to edit progress display */}
        {isEditing ? (
          <form
            onSubmit={handleCommitEdit}
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="number"
              min={0}
              max={maxProgress || 99999}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => handleCommitEdit()}
              autoFocus
              className="w-14 rounded bg-zinc-800 border border-zinc-600 px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-zinc-400">
              {maxProgress ? `/ ${maxProgress}` : unit}
            </span>
            <button
              type="submit"
              className="p-1 text-emerald-400 hover:text-emerald-300 rounded"
            >
              <Check className="size-3" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setTempValue(currentProgress.toString());
              setIsEditing(true);
            }}
            title="Click to jump to specific number"
            className="group/prog flex items-center gap-1 font-mono font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
          >
            <span className={cn(
              "px-1.5 py-0.5 rounded border transition-all",
              isDragging
                ? "bg-indigo-600/40 text-indigo-200 border-indigo-500/60 ring-1 ring-indigo-500/30"
                : "bg-zinc-800/80 group-hover/prog:bg-zinc-700/80 border-zinc-700/60"
            )}>
              {unit} {displayProgress}
            </span>
            <span className="text-zinc-400">
              {maxProgress ? `/ ${maxProgress}` : ""}
            </span>
            {maxProgress && percentage >= 100 && (
              <span className="text-emerald-400 font-sans font-semibold text-[10px] ml-1">
                DONE
              </span>
            )}
          </button>
        )}

        {/* Stepper Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || (currentProgress <= 0 && (!isManga || volCurrent <= 1))}
            aria-label="Decrease progress"
            className={cn(
              "flex items-center justify-center rounded bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700/50 active:scale-95",
              compact ? "size-6" : "size-7"
            )}
          >
            <Minus className={compact ? "size-3" : "size-3.5"} />
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={
              disabled ||
              (Boolean(maxProgress) &&
                currentProgress >= (maxProgress || 0) &&
                (!isManga || (Boolean(maxVolumes) && volCurrent >= (maxVolumes || 0))))
            }
            aria-label="Increase progress"
            className={cn(
              "flex items-center justify-center rounded bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700/50 active:scale-95 font-bold",
              compact ? "size-6" : "size-7"
            )}
          >
            <Plus className={compact ? "size-3" : "size-3.5"} />
          </button>
        </div>
      </div>

      {/* Interactive Range Slider / Visual Progress Bar */}
      {maxProgress && maxProgress > 0 ? (
        <div className="relative group/slider flex items-center w-full py-1">
          {/* Background Track */}
          <div className="w-full bg-zinc-800/90 rounded-full h-1.5 overflow-hidden ring-1 ring-white/5 pointer-events-none transition-all group-hover/slider:h-2">
            {/* Active Fill Gradient */}
            <div
              className={cn(
                "h-full transition-[width] ease-out rounded-full",
                percentage >= 100
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                  : "bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Interactive Range Input Overlay */}
          <input
            type="range"
            min={0}
            max={maxProgress}
            step={1}
            value={displayProgress}
            disabled={disabled}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onChange={handleSliderChange}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            onKeyUp={handleSliderCommit}
            title={`Drag knob to jump (${displayProgress}/${maxProgress} ${unit}s)`}
            className="progress-slider absolute inset-0 w-full h-full opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing"
            style={{ opacity: isDragging ? 1 : undefined }}
          />
        </div>
      ) : (
        <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-indigo-500/50 w-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
