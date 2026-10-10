import { ensureDb } from "@/server/db/client";
import { computeLazyClosures } from "@/server/domain/competition-state";
import type { CompetitionStatus, TieRule } from "@/types/domain";
import { createId } from "@/lib/id";

export type CompetitionSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  coverEmoji: string;
  status: CompetitionStatus;
  entryCost: number;
  maxParticipants: number | null;
  opensAt: string;
  closesAt: string;
  expectedResultAt: string | null;
  tieRule: TieRule;
  participantsCount: number;
  pool: number;
};

export type CompetitionDetail = CompetitionSummary & {
  rulesText: string;
  resolutionNote: string | null;
  cancelledReason: string | null;
  winningOptionId: string | null;
  resolvedAt: string | null;
  options: { id: string; label: string; description: string | null; position: number; predictionCount: number }[];
};

/**
 * Cierre perezoso: pasa a `closed` toda competencia open vencida.
 * Idempotente y seguro para llamar en cualquier página.
 */
export async function syncCompetitionStates(now = new Date()): Promise<number> {
  const client = await ensureDb();
  const r = await client.execute(
    `SELECT id, status, closes_at FROM competitions WHERE status = 'open'`,
  );
  const open = r.rows.map((row) => ({
    id: String(row.id),
    status: String(row.status),
    closesAt: String(row.closes_at),
  }));
  const toClose = computeLazyClosures(open, now);
  for (const id of toClose) {
    await client.execute({
      sql: `UPDATE competitions SET status = 'closed', updated_at = ? WHERE id = ? AND status = 'open'`,
      args: [now.toISOString(), id],
    });
  }
  return toClose.length;
}

function toSummary(row: Record<string, unknown>): CompetitionSummary {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    coverEmoji: String(row.cover_emoji),
    status: String(row.status) as CompetitionStatus,
    entryCost: Number(row.entry_cost),
    maxParticipants: row.max_participants === null || row.max_participants === undefined ? null : Number(row.max_participants),
    opensAt: String(row.opens_at),
    closesAt: String(row.closes_at),
    expectedResultAt: row.expected_result_at ? String(row.expected_result_at) : null,
    tieRule: String(row.tie_rule) as TieRule,
    participantsCount: Number(row.participants_count ?? 0),
    pool: Number(row.pool ?? 0),
  };
}

export async function listCompetitions(opts: {
  status?: CompetitionStatus | "all";
  category?: string;
  search?: string;
  sort?: "closing_soon" | "most_participants" | "biggest_pool" | "recent";
  includeDrafts?: boolean;
  limit?: number;
} = {}): Promise<CompetitionSummary[]> {
  const client = await ensureDb();
  const where: string[] = [];
  const args: (string | number)[] = [];

  if (opts.includeDrafts) {
    // admin: todo
  } else {
    where.push(`c.status != 'draft'`);
  }
  if (opts.status && opts.status !== "all") {
    where.push(`c.status = ?`);
    args.push(opts.status);
  }
  if (opts.category && opts.category !== "todas") {
    where.push(`c.category = ?`);
    args.push(opts.category);
  }
  if (opts.search && opts.search.trim()) {
    where.push(`(c.title LIKE ? OR c.description LIKE ?)`);
    const like = `%${opts.search.trim()}%`;
    args.push(like, like);
  }

  let orderBy = "c.closes_at ASC";
  switch (opts.sort) {
    case "most_participants": orderBy = "participants_count DESC"; break;
    case "biggest_pool": orderBy = "pool DESC"; break;
    case "recent": orderBy = "c.created_at DESC"; break;
    default: orderBy = "c.closes_at ASC";
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const r = await client.execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM predictions p WHERE p.competition_id = c.id) AS participants_count,
            (SELECT COALESCE(SUM(p.stake), 0) FROM predictions p WHERE p.competition_id = c.id) AS pool
          FROM competitions c
          ${whereSql}
          ORDER BY 
            CASE 
              WHEN c.status = 'open' THEN 0 
              WHEN c.status = 'closed' THEN 1 
              ELSE 2 
            END ASC, 
            ${orderBy}
          LIMIT ?`,
    args: [...args, opts.limit ?? 60],
  });

  return r.rows.map((row) => toSummary(row as unknown as Record<string, unknown>));
}

export async function getCompetitionBySlug(
  slug: string,
): Promise<CompetitionDetail | null> {
  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM predictions p WHERE p.competition_id = c.id) AS participants_count,
            (SELECT COALESCE(SUM(p.stake), 0) FROM predictions p WHERE p.competition_id = c.id) AS pool
          FROM competitions c WHERE c.slug = ? LIMIT 1`,
    args: [slug],
  });
  const row = r.rows[0];
  if (!row) return null;
  const summary = toSummary(row as unknown as Record<string, unknown>);

  const optsR = await client.execute({
    sql: `SELECT o.id, o.label, o.description, o.position,
            (SELECT COUNT(*) FROM predictions p WHERE p.option_id = o.id) AS prediction_count
          FROM options o WHERE o.competition_id = ? ORDER BY o.position ASC`,
    args: [summary.id],
  });

  return {
    ...summary,
    rulesText: String(row.rules_text),
    resolutionNote: row.resolution_note ? String(row.resolution_note) : null,
    cancelledReason: row.cancelled_reason ? String(row.cancelled_reason) : null,
    winningOptionId: row.winning_option_id ? String(row.winning_option_id) : null,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    options: optsR.rows.map((o) => ({
      id: String(o.id),
      label: String(o.label),
      description: o.description ? String(o.description) : null,
      position: Number(o.position),
      predictionCount: Number(o.prediction_count),
    })),
  };
}

export type ParticipantRow = { username: string; displayName: string; createdAt: string };

export async function listParticipants(competitionId: string): Promise<ParticipantRow[]> {
  const client = await ensureDb();
  const r = await client.execute({
    sql: `SELECT u.username, u.display_name, p.created_at
          FROM predictions p JOIN users u ON u.id = p.user_id
          WHERE p.competition_id = ? ORDER BY p.created_at ASC`,
    args: [competitionId],
  });
  return r.rows.map((row) => ({
    username: String(row.username),
    displayName: String(row.display_name),
    createdAt: String(row.created_at),
  }));
}

/** Encuentra un slug único a partir del título. */
export async function uniqueSlug(title: string): Promise<string> {
  const client = await ensureDb();
  const base = slugify(title) || "competencia";
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const r = await client.execute({
      sql: `SELECT 1 FROM competitions WHERE slug = ? LIMIT 1`,
      args: [candidate],
    });
    if (r.rows.length === 0) return candidate;
    candidate = `${base}-${createId().slice(0, 5)}`;
  }
  return `${base}-${Date.now()}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
