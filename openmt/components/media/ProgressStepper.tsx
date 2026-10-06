import React, { useState, useEffect, useRef } from "react";
import { MediaType } from "@/db/schema";
import { MEDIA_TYPE_CONFIG } from "./MediaBadge";
import { Plus, Minus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStepperProps {
  currentProgress: number;
  maxProgress?: number | null;
  mediaType: MediaType;
  onUpdate: (newProgress: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ProgressStepper({
  currentProgress,
  maxProgress,
  mediaType,
  onUpdate,
  disabled = false,
  compact = false,
}: ProgressStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(currentProgress.toString());
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(currentProgress);

  // Sync dragValue when currentProgress changes from external updates while not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragValue(currentProgress);
      setTempValue(currentProgress.toString());
    }
  }, [currentProgress, isDragging]);

  const config = MEDIA_TYPE_CONFIG[mediaType] || MEDIA_TYPE_CONFIG.anime;
  const unit = config.unitName;

  const displayProgress = isDragging ? dragValue : currentProgress;

  const percentage =
    maxProgress && maxProgress > 0
      ? Math.min(100, Math.round((displayProgress / maxProgress) * 100))
      : 0;

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProgress > 0 && !disabled) {
      onUpdate(currentProgress - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (maxProgress && currentProgress >= maxProgress) {
      return;
    }
    onUpdate(currentProgress + 1);
  };

  const handleCommitEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(tempValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const finalVal = maxProgress ? Math.min(parsed, maxProgress) : parsed;
      onUpdate(finalVal);
    } else {
      setTempValue(currentProgress.toString());
    }
    setIsEditing(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setDragValue(val);
  };

  const handleSliderCommit = () => {
    setIsDragging(false);
    if (dragValue !== currentProgress) {
      onUpdate(dragValue);
    }
  };

  return (
    <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
      {/* Top Row: Value Badge / Edit & Stepper Buttons */}
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
            disabled={disabled || currentProgress <= 0}
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
            disabled={disabled || (Boolean(maxProgress) && currentProgress >= (maxProgress || 0))}
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
