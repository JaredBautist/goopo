import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 font-display text-base font-bold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-xs font-bold text-white">G</span>
            Goopo
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Pronósticos entre participantes con una moneda virtual. Sin dinero real.
          </p>
        </div>
        <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          <Link href="/competencias" className="text-muted-foreground hover:text-foreground">Competencias</Link>
          <Link href="/reglas" className="text-muted-foreground hover:text-foreground">Reglas</Link>
          <Link href="/ranking" className="text-muted-foreground hover:text-foreground">Ranking</Link>
          <Link href="/juego-responsable" className="text-muted-foreground hover:text-foreground">Juego responsable</Link>
          <Link href="/acerca" className="text-muted-foreground hover:text-foreground">Acerca de</Link>
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-xs text-muted-foreground">
        © {new Date().getFullYear()} Goopo. Sin pagos, sin retiros, sin dinero real.
      </p>
    </footer>
  );
}
