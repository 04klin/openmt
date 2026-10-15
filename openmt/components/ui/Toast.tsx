"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

export type ToastMessage = { id: number; text: string; tone: "success" | "error" };

export function ToastViewport({ messages, onDismiss }: { messages: ToastMessage[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {messages.map((message) => (
        <div key={message.id} className={`flex items-start gap-2 rounded-2xl border p-3 text-xs shadow-2xl backdrop-blur ${message.tone === "error" ? "border-red-500/30 bg-red-950/90 text-red-100" : "border-emerald-500/30 bg-emerald-950/90 text-emerald-100"}`}>
          {message.tone === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          <span className="flex-1">{message.text}</span>
          <button type="button" onClick={() => onDismiss(message.id)} aria-label="Dismiss notification"><X className="size-3.5" /></button>
        </div>
      ))}
    </div>
  );
}
