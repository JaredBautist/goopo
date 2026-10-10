"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatGoopos } from "@/lib/constants";
import { getUserAvatar } from "@/lib/avatars";
import { WINNERS_100, type WinnerNotification } from "@/lib/winners-catalog";
import { Trophy, X, TrendingUp } from "lucide-react";

export type WinnerEvent = WinnerNotification;

const DEFAULT_WINNERS: WinnerEvent[] = WINNERS_100;

export function LiveWinnersToast() {
  const [winners, setWinners] = useState<WinnerEvent[]>(DEFAULT_WINNERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Cargar ganadores reales de la base de datos
  useEffect(() => {
    let active = true;
    fetch("/api/actividad-reciente")
      .then((res) => res.json())
      .then((data: WinnerEvent[]) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setWinners(data);
        }
      })
      .catch(() => {
        // Fallback silencioso con lista predeterminada
      });
    return () => {
      active = false;
    };
  }, []);

  // Inicializar primera aparición tras 2.5 segundos
  useEffect(() => {
    if (dismissed) return;
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);
    return () => clearTimeout(initialTimer);
  }, [dismissed]);

  // Ciclo automático de visibilidad y rotación
  useEffect(() => {
    if (dismissed || winners.length === 0) return;

    let timer: NodeJS.Timeout;

    if (isVisible) {
      // Visible durante 6 segundos antes de ocultarse
      timer = setTimeout(() => {
        if (!isPaused) {
          setIsVisible(false);
        }
      }, 6000);
    } else {
      // Oculto durante 4.5 segundos antes de mostrar el siguiente
      timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % winners.length);
        setIsVisible(true);
      }, 4500);
    }

    return () => clearTimeout(timer);
  }, [isVisible, isPaused, dismissed, winners.length]);

  const current = winners[currentIndex];
  if (!current || dismissed) return null;

  const avatar = current.avatarUrl || getUserAvatar(current.username);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed bottom-20 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-auto z-40 max-w-[calc(100vw-24px)] sm:max-w-md transition-all duration-500 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
          : "translate-y-8 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="relative flex items-center gap-3.5 rounded-2xl border border-border/80 bg-surface/95 dark:bg-surface/90 p-3.5 shadow-2xl backdrop-blur-xl transition-all hover:border-primary-500/50">
        {/* Foto de perfil real de la persona con badge de ganador */}
        <div className="relative h-12 w-12 sm:h-13 sm:w-13 shrink-0">
          <div className="relative h-12 w-12 sm:h-13 sm:w-13 overflow-hidden rounded-full border-2 border-primary-500/40 bg-surface-muted shadow-md ring-2 ring-primary-500/20">
            <Image
              src={avatar}
              alt={current.displayName}
              fill
              sizes="52px"
              className="object-cover"
            />
          </div>
          {/* Badge dorado de trofeo de ganador */}
          <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-neutral-950 shadow-md ring-2 ring-surface">
            <Trophy className="h-3 w-3" />
          </div>
        </div>

        {/* Información del ganador */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="truncate text-xs font-semibold text-foreground">
              {current.displayName}
            </p>
            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              +{formatGoopos(current.payout)}
            </span>
          </div>

          <Link
            href={`/competencias/${current.slug}`}
            className="line-clamp-1 text-xs text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Acaba de acertar en <strong className="font-medium text-foreground">{current.title}</strong>
          </Link>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-accent-600 dark:text-accent-400">
              <TrendingUp className="h-2.5 w-2.5" />
              Pronóstico ganador
            </span>
            <span>·</span>
            <span>Hace un momento</span>
          </div>
        </div>

        {/* Botón de descarte */}
        <button
          onClick={() => {
            setIsVisible(false);
            setDismissed(true);
          }}
          aria-label="Cerrar notificación"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
