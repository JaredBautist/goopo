"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary caught error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="text-6xl" aria-hidden>😵</span>
      <h1 className="mt-4 font-display text-3xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo.
      </p>
      {error?.message && (
        <p className="mt-2 text-xs font-mono text-red-400/80 bg-red-950/30 px-3 py-1.5 rounded border border-red-500/20 max-w-md break-all">
          {error.message}
        </p>
      )}
      <Button className="mt-6" onClick={reset}>Reintentar</Button>
    </div>
  );
}
