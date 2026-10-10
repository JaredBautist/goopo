import { Card } from "@/components/ui";

export const metadata = { title: "Reglas" };

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Reglas de la plataforma</h1>
      <p className="mt-2 text-muted-foreground">
        Lenguaje claro, sin letra pequeña. Estas reglas aplican a todas las competencias de Goopo.
      </p>

      <div className="mt-8 space-y-4">
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">1. Cómo se participa</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Eliges una competencia y revisas sus reglas <strong>antes</strong> de participar.</li>
            <li>Seleccionas una opción y confirmas tu pronóstico pagando el costo de entrada en Goopos.</li>
            <li>Al confirmar, tu participación queda <strong>bloqueada</strong>: no se puede editar ni retirar.</li>
            <li>Solo puedes participar <strong>una vez</strong> por competencia.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">2. Cuándo se cierra</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Cada competencia tiene una fecha y hora de cierre publicadas de antemano.</li>
            <li>Al llegar el cierre, el sistema deja de aceptar participaciones de forma automática.</li>
            <li>El reloj válido siempre es el del servidor, nunca el de tu dispositivo.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">3. Cómo se resuelve y quién gana</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Se compara el resultado real del evento con las opciones disponibles.</li>
            <li>Gana quien haya pronosticado la opción correcta.</li>
            <li>El organizador (equipo Goopo) resuelve la competencia y el sistema reparte el pozo de forma automática.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">4. Empates</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada competencia publica su regla de desempate <strong>antes</strong> de abrir:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li><strong>Reparto igual:</strong> el pozo se divide en partes iguales entre los acertantes (el residuo va al primero).</li>
            <li><strong>Primer acierto:</strong> el primer pronóstico correcto se lleva todo el pozo.</li>
            <li><strong>Empate anula:</strong> si aciertan varias personas, todos reciben su entrada de vuelta.</li>
          </ul>
        </Card>

        <Card className="p-6 border-amber-200 dark:border-amber-900">
          <h2 className="font-display text-xl font-semibold">5. La moneda Goopo (G)</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Los Goopos son una moneda <strong>100% virtual de demostración</strong>.</li>
            <li>No se compran, no se venden ni se canjean por dinero. No hay pagos reales.</li>
            <li>Al registrarte recibes 1.000 G de regalo; puedes reclamar una recarga demo de 200 G cada 24 h si tu saldo es menor a 200 G.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">6. Cancelaciones</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Si una competencia se cancela, todos los participantes reciben el reembolso del 100% de su entrada,
            y la competencia queda marcada como cancelada con su motivo visible.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">7. Conducta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Una cuenta por persona. El uso de múltiples cuentas para manipular competencias puede resultar en suspensión.
            Durante una autoexclusión voluntaria no puedes participar, aunque sí puedes consultar la plataforma.
          </p>
        </Card>
      </div>
    </div>
  );
}
