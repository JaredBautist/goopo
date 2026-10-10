"use client";

import { Button } from "@/components/ui";

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="text-6xl" aria-hidden>😵</span>
      <h1 className="mt-4 font-display text-3xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo.
      </p>
      <Button className="mt-6" onClick={reset}>Reintentar</Button>
    </div>
  );
}
