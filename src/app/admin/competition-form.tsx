"use client";

import { useActionState, useState } from "react";
import { createCompetitionAction, type AdminState } from "@/actions/admin";
import { Button, Card, Input, Label, Select, Textarea, FieldError } from "@/components/ui";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

const CATEGORIES = [
  ["deportes", "Deportes"],
  ["esports", "eSports"],
  ["academico", "Académico"],
  ["entretenimiento", "Entretenimiento"],
  ["clima", "Clima"],
  ["comunidad", "Comunidad"],
  ["otro", "Otro"],
];

export function CompetitionForm({ mode }: { mode: "create" | "edit" }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(createCompetitionAction, {});
  const [options, setOptions] = useState<{ label: string; description: string }[]>([
    { label: "", description: "" },
    { label: "", description: "" },
  ]);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= options.length) return;
    const next = [...options];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOptions(next);
  }

  const valid = options.length >= 2 && options.every((o) => o.label.trim() !== "");

  return (
    <form action={action} className="space-y-4">
      <Card className="space-y-4 p-5">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" required minLength={5} maxLength={140} placeholder="¿Quién ganará…?" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select id="category" name="category" defaultValue="otro">
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="coverEmoji">Miniatura o portada (URL o emoji)</Label>
            <Input id="coverEmoji" name="coverEmoji" defaultValue="🎲" placeholder="Ej: /images/categories/deportes.jpg" maxLength={255} />
          </div>
          <div>
            <Label htmlFor="entryCost">Costo de entrada (G)</Label>
            <Input id="entryCost" name="entryCost" type="number" min={1} max={10000} defaultValue={100} required />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Descripción breve</Label>
          <Textarea id="description" name="description" required minLength={10} maxLength={600} />
        </div>
        <div>
          <Label htmlFor="rulesText">Reglas completas (se muestran antes de participar)</Label>
          <Textarea id="rulesText" name="rulesText" required minLength={20} maxLength={5000} className="min-h-32" placeholder={"## Reglas\n- El resultado oficial es…\n- …"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="opensAt">Apertura</Label>
            <Input id="opensAt" name="opensAt" type="datetime-local" required />
            <p className="mt-1 text-xs text-muted-foreground">Hora de Colombia (UTC−5).</p>
          </div>
          <div>
            <Label htmlFor="closesAt">Cierre</Label>
            <Input id="closesAt" name="closesAt" type="datetime-local" required />
          </div>
          <div>
            <Label htmlFor="expectedResultAt">Resultado estimado (opcional)</Label>
            <Input id="expectedResultAt" name="expectedResultAt" type="datetime-local" />
          </div>
          <div>
            <Label htmlFor="maxParticipants">Cupo máximo (opcional)</Label>
            <Input id="maxParticipants" name="maxParticipants" type="number" min={2} max={1000} placeholder="sin límite" />
          </div>
        </div>
        <div>
          <Label htmlFor="tieRule">Regla de empate</Label>
          <Select id="tieRule" name="tieRule" defaultValue="split_equal">
            <option value="split_equal">Reparto igual (residuo al primero)</option>
            <option value="earliest_wins">Primer acierto se lleva todo</option>
            <option value="refund_all">Empate anula y reembolsa a todos</option>
          </Select>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold">Opciones ({options.length}/8)</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={options.length >= 8}
            onClick={() => setOptions((o) => [...o, { label: "", description: "" }])}
          >
            <Plus className="h-4 w-4" aria-hidden /> Añadir
          </Button>
        </div>
        <div className="mt-3 space-y-3">
          {options.map((opt, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-1">
                <button type="button" aria-label="Subir" onClick={() => move(i, -1)} className="rounded p-0.5 hover:bg-surface-muted disabled:opacity-30" disabled={i === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Bajar" onClick={() => move(i, 1)} className="rounded p-0.5 hover:bg-surface-muted disabled:opacity-30" disabled={i === options.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input
                  name="optionLabel"
                  value={opt.label}
                  onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  placeholder={`Opción ${i + 1}`}
                  aria-label={`Etiqueta de la opción ${i + 1}`}
                  required={i < 2}
                  maxLength={120}
                />
                <Input
                  name="optionDescription"
                  value={opt.description}
                  onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                  placeholder="Descripción (opcional)"
                  aria-label={`Descripción de la opción ${i + 1}`}
                  maxLength={300}
                />
              </div>
              <button
                type="button"
                aria-label={`Eliminar opción ${i + 1}`}
                className="mt-2 rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                disabled={options.length <= 2}
                onClick={() => setOptions((o) => o.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Mínimo 2, máximo 8 opciones. Reordénalas: la primera recibe el residuo en repartos iguales.</p>
      </Card>

      <FieldError message={state.error} />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending || !valid}>
          {pending ? "Guardando…" : "Guardar borrador"}
        </Button>
      </div>
      {mode === "edit" && <input type="hidden" name="mode" value="edit" />}
    </form>
  );
}
