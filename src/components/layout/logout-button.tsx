"use client";

import { logout } from "@/actions/session";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm" className={cn("text-muted-foreground", className)}>
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden lg:inline">Salir</span>
      </Button>
    </form>
  );
}
