import React from "react";
import { MediaStatus } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Clock, Play, CheckCircle2, PauseCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: MediaStatus;
  className?: string;
  showIcon?: boolean;
}

export const STATUS_CONFIG: Record<
  MediaStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
  }
> = {
  active: {
    label: "In Progress",
    icon: Play,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  backlog: {
    label: "Backlog",
    icon: Clock,
    badgeClass: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  hold: {
    label: "On Hold",
    icon: PauseCircle,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  dropped: {
    label: "Dropped",
    icon: XCircle,
    badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.backlog;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.badgeClass,
        className
      )}
    >
      {showIcon && <Icon className="size-3" />}
      <span>{config.label}</span>
    </span>
  );
}
