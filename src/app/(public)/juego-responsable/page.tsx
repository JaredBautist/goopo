import { Card } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Juego responsable" };

export default function ResponsiblePlayPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Juego responsable</h1>
      <p className="mt-2 text-muted-foreground">
        Goopo funciona con moneda virtual sin dinero real, pero el diseño de cualquier plataforma de
        pronósticos debe tomar en serio el bienestar de las personas.
      </p>

      <div className="mt-8 space-y-4">
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Herramientas disponibles en Goopo</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li><strong>Límite diario:</strong> define el máximo de Goopos que puedes apostar por día. Bajarlo aplica al instante; subirlo espera 24 horas.</li>
            <li><strong>Autoexclusión:</strong> puedes bloquearte por 24 horas, 7 días o 30 días. Durante ese tiempo nadie puede revertir la decisión — ni tú.</li>
            <li><strong>Transparente siempre:</strong> las reglas, el cierre y la forma de reparto se ven antes de participar.</li>
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/mi-cuenta" className="font-medium text-primary-700 hover:underline dark:text-primary-300">
              Configura tus límites en tu cuenta →
            </Link>
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Señales de alerta</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Usar el juego para escapar de problemas o emociones negativas.</li>
            <li>Persiguir pérdidas intentando recuperar lo jugado.</li>
            <li>Ocultar o mentir sobre cuánto tiempo o dinero se dedica a jugar.</li>
            <li>Pedir dinero prestado para jugar.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Consejos</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Trata las apuestas como un pasatiempo, no como una fuente de ingresos.</li>
            <li>Establece un presupuesto claro antes de participar y respétalo.</li>
            <li>Acepta que el resultado depende de la suerte: nadie controla el desenlace.</li>
            <li>Toma descansos regulares y mantén otras actividades.</li>
          </ul>
        </Card>

        <Card className="p-6 border-amber-200 dark:border-amber-900">
          <h2 className="font-display text-xl font-semibold">Nota importante</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Este prototipo no ofrece servicio de apuestas reales y, por lo tanto, no incluye líneas de
            ayuda de ninguna jurisdicción específica. En un servicio real se enlazaría a entidades de
            ayuda locales certificadas, se aplicarían controles de edad documentales, límites regulatorios
            y normativas de juego de suerte y azar de cada país.
          </p>
        </Card>
      </div>
    </div>
  );
}
