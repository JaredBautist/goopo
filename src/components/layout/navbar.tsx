"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Bell, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "./logout-button";
import { BottomNav } from "./bottom-nav";

export type NavUser = { username: string; displayName: string; role: string; balance: number; unread: number } | null;

export function Navbar({ user }: { user?: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra el menú móvil al cambiar de ruta
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: "/competencias", label: "Competencias" },
    { href: "/ranking", label: "Ranking" },
    { href: "/reglas", label: "Reglas" },
    ...(user
      ? [
          { href: "/mis-pronosticos", label: "Mis pronósticos" },
          { href: "/billetera", label: "Billetera" },
        ]
      : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-4" aria-label="Principal">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white shadow-sm">
              G
            </span>
            <span>Goopo</span>
          </Link>

          {/* Enlaces de escritorio */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(l.href)
                    ? "bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200 font-semibold"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            {user ? (
              <>
                <Link
                  href="/notificaciones"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                  aria-label={`Notificaciones${user.unread > 0 ? `, ${user.unread} sin leer` : ""}`}
                >
                  <Bell className="h-5 w-5" aria-hidden />
                  {user.unread > 0 && (
                    <span className="absolute 1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[10px] font-bold text-white ring-2 ring-surface">
                      {user.unread > 9 ? "9+" : user.unread}
                    </span>
                  )}
                </Link>

                {/* Saldo de Goopos - Visible tanto en móvil como en escritorio */}
                <Link
                  href="/billetera"
                  className="flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-muted/90 px-2.5 py-1 text-xs sm:text-sm font-bold text-accent-500 hover:border-accent-500/50 transition-all shadow-xs"
                  title="Ir a tu billetera"
                >
                  <Coins className="h-4 w-4 shrink-0 text-accent-500" aria-hidden />
                  <span className="tabular-nums">{new Intl.NumberFormat("es-CO").format(user.balance)} G</span>
                </Link>

                <LogoutButton className="hidden sm:inline-flex" />
              </>
            ) : (
              <>
                <Link
                  href="/ingresar"
                  className="rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hidden xs:inline-flex"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl bg-primary-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-primary-700 shadow-sm"
                >
                  Registrarse
                </Link>
              </>
            )}

            {/* Botón hamburguesa para móvil */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </nav>

        {/* Menú desplegable para móvil */}
        {open && (
          <div className="border-t border-border bg-surface/98 backdrop-blur-xl px-4 py-4 md:hidden shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1.5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium min-h-[44px] transition-colors",
                    pathname.startsWith(l.href)
                      ? "bg-accent-500/15 text-accent-400 font-bold"
                      : "text-foreground hover:bg-surface-muted",
                  )}
                >
                  <span>{l.label}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                </Link>
              ))}

              <div className="mt-2 border-t border-border/60 pt-2 flex flex-col gap-2">
                <Link
                  href="/juego-responsable"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-muted-foreground hover:bg-surface-muted min-h-[40px]"
                >
                  <span>Juego responsable</span>
                </Link>
                <Link
                  href="/acerca"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-muted-foreground hover:bg-surface-muted min-h-[40px]"
                >
                  <span>Acerca de Goopo</span>
                </Link>

                {user ? (
                  <div className="pt-2">
                    <LogoutButton className="w-full h-11 justify-center" />
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      href="/ingresar"
                      className="flex items-center justify-center rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm font-semibold text-foreground min-h-[44px]"
                    >
                      Ingresar
                    </Link>
                    <Link
                      href="/registro"
                      className="flex items-center justify-center rounded-xl bg-primary-600 px-3 py-2.5 text-center text-sm font-semibold text-white min-h-[44px]"
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Barra de navegación inferior móvil para acceso rápido con el pulgar */}
      <BottomNav user={user} />
    </>
  );
}
