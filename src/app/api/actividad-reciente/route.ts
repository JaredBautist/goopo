import { NextResponse } from "next/server";
import { ensureDb } from "@/server/db/client";
import { WINNERS_100 } from "@/lib/winners-catalog";
import { getUserAvatar } from "@/lib/avatars";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await ensureDb();
    const res = await client.execute({
      sql: `SELECT p.id, p.payout, u.display_name, u.username, c.title, c.category, c.slug, p.created_at
            FROM predictions p
            JOIN users u ON u.id = p.user_id
            JOIN competitions c ON c.id = p.competition_id
            WHERE p.status = 'won' AND p.payout > 0
            ORDER BY p.created_at DESC
            LIMIT 20`,
    });

    const dbWinners = res.rows.map((row, idx) => ({
      id: String(row.id),
      displayName: String(row.display_name),
      username: String(row.username),
      avatarUrl: getUserAvatar(String(row.username)),
      payout: Number(row.payout),
      title: String(row.title),
      category: String(row.category),
      slug: String(row.slug),
      secondsAgo: 8 + idx * 25,
    }));

    const dbUsernames = new Set(dbWinners.map((w) => w.username));
    const catalogFiltered = WINNERS_100.filter((w) => !dbUsernames.has(w.username));
    const allWinners = [...dbWinners, ...catalogFiltered].slice(0, 100);

    return NextResponse.json(allWinners);
  } catch {
    return NextResponse.json(WINNERS_100);
  }
}
