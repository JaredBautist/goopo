import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="text-6xl" aria-hidden>🎲</span>
      <h1 className="mt-4 font-display text-3xl font-bold">Esta página no existe</h1>
      <p className="mt-2 text-muted-foreground">
        Como en Goopo, no todo sale como se pronostica. Vuelve al inicio o revisa las competencias activas.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/"><Button>Ir al inicio</Button></Link>
        <Link href="/competencias"><Button variant="secondary">Ver competencias</Button></Link>
      </div>
    </div>
  );
}
