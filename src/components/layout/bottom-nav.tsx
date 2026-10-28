"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Wallet, BarChart3, User, LogIn } from "lucide-react";
import type { NavUser } from "./navbar";

export function BottomNav({ user }: { user?: NavUser }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Inicio",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/competencias",
      label: "Eventos",
      icon: Trophy,
      isActive: pathname.startsWith("/competencias"),
    },
    {
      href: user ? "/billetera" : "/ingresar",
      label: "Billetera",
      icon: Wallet,
      isActive: pathname.startsWith("/billetera"),
    },
    {
      href: "/ranking",
      label: "Ranking",
      icon: BarChart3,
      isActive: pathname.startsWith("/ranking"),
    },
    {
      href: user ? "/mi-cuenta" : "/ingresar",
      label: user ? "Perfil" : "Entrar",
      icon: user ? User : LogIn,
      isActive: user ? pathname.startsWith("/mi-cuenta") : pathname.startsWith("/ingresar"),
      hasNotification: Boolean(user && user.unread > 0),
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/95 dark:bg-surface/90 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl shadow-2xl md:hidden"
    >
      <div className="flex h-15 items-center justify-between px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 ${
                item.isActive
                  ? "text-accent-500 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 transition-colors ${item.isActive ? "text-accent-500 scale-105" : ""}`} />
                {item.hasNotification && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface animate-pulse" />
                )}
              </div>
              <span className="mt-1 text-[11px] font-medium tracking-tight truncate max-w-full">
                {item.label}
              </span>
              {item.isActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-accent-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
