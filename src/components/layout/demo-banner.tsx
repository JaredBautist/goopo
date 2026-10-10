import { getDbMode } from "@/server/db/client";

export function DemoBanner() {
  let mode: string = "local";
  try {
    mode = getDbMode();
  } catch {
    mode = "local";
  }
  if (mode === "local") return null;
  return (
    <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-center text-xs font-medium text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300">
      {mode === "tmp"
        ? "Modo demo: los datos pueden reiniciarse periódicamente (almacenamiento efímero)."
        : "Modo demo con persistencia en Turso."}
    </div>
  );
}
