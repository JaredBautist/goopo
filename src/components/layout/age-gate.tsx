"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "goopo_age_confirmed_v1";

export function AgeGate() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- decisión de visibilidad lee localStorage (external system) en el cliente
    setVisible(localStorage.getItem(KEY) !== "1");
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // noop
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agegate-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">G</span>
          Bienvenido a Goopo
        </div>
        <div className="mt-4 text-sm leading-relaxed text-foreground">
          <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary-600"
            />
            <span>
              Confirmo que soy mayor de 18 años y entiendo que Goopo es una{" "}
              <strong>plataforma con moneda virtual sin dinero real</strong>: los Goopos tienen valor de demostración y no pueden comprarse ni canjearse.
            </span>
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            En un servicio real se exigiría verificación documental de edad y cumplimiento de la normativa de juegos de suerte
            y azar aplicable. Más información en{" "}
            <Link href="/juego-responsable" className="underline hover:text-foreground">
              juego responsable
            </Link>
            .
          </p>
        </div>
        <button
          onClick={accept}
          disabled={!checked}
          className="mt-5 h-11 w-full rounded-xl bg-primary-600 font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
        >
          Entrar
        </button>
        <button
          onClick={() => {
            document.body.innerHTML = "";
            document.title = "Acceso restringido";
          }}
          className="mt-2 w-full rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Soy menor de 18 años
        </button>
      </div>
    </div>
  );
}
