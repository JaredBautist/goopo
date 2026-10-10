"use client";

import { Button } from "@/components/ui";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toaster";

export function ShareButton() {
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast("Enlace copiado al portapapeles");
        } catch {
          toast("No se pudo copiar el enlace", "error");
        }
      }}
    >
      <Share2 className="h-4 w-4" aria-hidden /> Compartir enlace
    </Button>
  );
}
