/**
 * Estado de una competencia y cierre perezoso. PURO.
 *
 *          publicar            closes_at alcanzado / cierre manual        resolver
 * draft ───────────▶ open ────────────────────────────────▶ closed ───────────▶ resolved
 *                        │                                       │
 *                        └─────────────── cancelar ──────────────┴──────▶ cancelled
 */

import type { CompetitionStatus } from "@/types/domain";

export type Transition =
  | "publish"
  | "auto_close"
  | "manual_close"
  | "resolve"
  | "cancel";

const ALLOWED: Record<Transition, CompetitionStatus[]> = {
  publish: ["draft"],
  auto_close: ["open"],
  manual_close: ["open"],
  resolve: ["closed"],
  cancel: ["draft", "open", "closed"],
};

const TARGET: Record<Transition, CompetitionStatus | null> = {
  publish: "open",
  auto_close: "closed",
  manual_close: "closed",
  resolve: "resolved",
  cancel: "cancelled",
};

export function canTransition(from: CompetitionStatus, t: Transition): boolean {
  return ALLOWED[t].includes(from);
}

export function nextStatus(from: CompetitionStatus, t: Transition): CompetitionStatus | null {
  if (!canTransition(from, t)) return null;
  return TARGET[t];
}

/** Devuelve las posibles transiciones de salida desde un estado (para UI admin). */
export function availableActions(status: CompetitionStatus): Transition[] {
  return (Object.keys(ALLOWED) as Transition[]).filter((t) =>
    canTransition(status, t),
  );
}

/**
 * Cierre perezoso: describe qué competencias `open` deben pasar a `closed`
 * porque ya alcanzó su `closes_at` en el instante `now` (inclusivo). Devuelve IDs.
 */
export function computeLazyClosures(
  competitions: { id: string; status: string; closesAt: string }[],
  now: Date,
): string[] {
  const nowMs = now.getTime();
  return competitions
    .filter((c) => c.status === "open" && new Date(c.closesAt).getTime() <= nowMs)
    .map((c) => c.id);
}

/** true si la competencia acepta participaciones en `now` (cierre exclusivo: en closes_at ya no acepta). */
export function acceptsPredictions(
  comp: { status: CompetitionStatus; opensAt: string; closesAt: string },
  now: Date,
): boolean {
  if (comp.status !== "open") return false;
  const nowMs = now.getTime();
  return (
    new Date(comp.opensAt).getTime() <= nowMs &&
    nowMs < new Date(comp.closesAt).getTime()
  );
}
