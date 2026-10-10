"use client";

import { useEffect, useState } from "react";

function format(ms: number): string {
  if (ms <= 0) return "Cerrada";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function Countdown({
  closesAt,
  onExpire,
  className,
}: {
  closesAt: string;
  onExpire?: () => void;
  className?: string;
}) {
  const target = new Date(closesAt).getTime();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const diff = target - Date.now();
      setRemaining(diff);
      if (diff <= 0) onExpire?.();
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, onExpire]);

  if (remaining === null) {
    return <span className={className}>…</span>;
  }
  const urgent = remaining < 60 * 60 * 1000;
  return (
    <time
      dateTime={closesAt}
      className={className}
      suppressHydrationWarning
    >
      {urgent ? "⏰ " : ""}
      {format(remaining)}
    </time>
  );
}
