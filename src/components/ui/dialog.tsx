"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  children,
  labelledBy = "dialog-title",
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelledBy?: string;
  maxWidth?: "max-w-md" | "max-w-lg" | "max-w-2xl";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <button
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          "relative w-full max-h-[90dvh] overflow-y-auto rounded-2xl bg-surface p-5 sm:p-6 shadow-xl ring-1 ring-border focus:outline-none",
          maxWidth,
        )}
      >
        <h2 id={labelledBy} className="font-display text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-3 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}
