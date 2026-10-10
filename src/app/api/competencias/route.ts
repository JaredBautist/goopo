import { NextResponse, type NextRequest } from "next/server";
import { listCompetitions, syncCompetitionStates } from "@/server/services/competitions.service";
import type { CompetitionStatus } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "all";
  const category = req.nextUrl.searchParams.get("categoria") ?? "todas";
  const comps = await listCompetitions({
    status: (status as CompetitionStatus | "all") || "all",
    category,
    limit: 50,
  });
  await syncCompetitionStates();
  return NextResponse.json({ ok: true, count: comps.length, competitions: comps });
}
