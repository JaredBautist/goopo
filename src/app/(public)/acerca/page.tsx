import { Card } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Acerca" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Acerca de Goopo</h1>
      <p className="mt-2 text-muted-foreground">
        Un proyecto académico que explora cómo organizar competencias de pronósticos entre participantes
        de forma <strong>sencilla, ordenada y transparente</strong>, donde la suerte tiene un papel
        importante y todos juegan con las mismas reglas publicadas de antemano.
      </p>

      <div className="mt-8 space-y-4">
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">El concepto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Antes de cada competencia quedan definidos el evento, las opciones disponibles, el momento de
            cierre y la forma de determinar al ganador, incluida la regla de desempate. El sistema valida
            los datos, impide cambios después del cierre y muestra los resultados de forma clara.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Tecnología</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li><strong>Next.js (App Router)</strong> con TypeScript estricto.</li>
            <li><strong>SQLite (libSQL) + Drizzle ORM</strong>, con despliegue en Vercel en tres modos: archivo local, demo efímero en /tmp, o Turso remoto.</li>
            <li><strong>Sesiones JWT</strong> firmadas en cookies httpOnly, autenticación con bcryptjs.</li>
            <li><strong>Tailwind CSS</strong> con modo claro/oscuro y accesibilidad WCAG AA.</li>
            <li>Pruebas de la lógica crítica (reparto de premios, cierre, límites) con Vitest.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">¿Qué haría falta para un servicio real?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Este prototipo <strong>no</strong> opera con dinero y no está habilitado para ello. Convertirlo en un servicio legal de apuestas exigiría, al menos:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Licencias y cumplimiento normativo de juegos de suerte y azar de cada jurisdicción.</li>
            <li>Verificación de edad documental (KYC) y control contra menores de edad.</li>
            <li>Pasarela de pagos licenciada, fiscales y de retiro de fondos.</li>
            <li>Auditoría independiente del reparto y del generador de resultados.</li>
            <li>Juego responsable avanzado: autoexclusión cruzada entre operadores, límites regulatorios y derivación a entidades de ayuda certificadas.</li>
          </ul>
          <p className="mt-3 text-sm">
            Lee más en <Link href="/juego-responsable" className="font-medium text-primary-700 hover:underline dark:text-primary-300">juego responsable</Link>.
          </p>
        </Card>
      </div>
    </div>
  );
}
