import { requireAdmin } from "@/server/services/session-user";
import { CompetitionForm } from "../../competition-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Nueva competencia" };

export default async function NewCompetitionPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Nueva competencia</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Se guardará como borrador; podrás publicarla cuando esté lista.
      </p>
      <div className="mt-6">
        <CompetitionForm mode="create" />
      </div>
    </div>
  );
}
