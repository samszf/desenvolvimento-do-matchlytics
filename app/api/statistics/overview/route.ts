import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { matches, matchStatistics } from '@/lib/db/schema'
import { summarize, performanceScore } from '@/lib/analytics'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const rows = await db.select().from(matches).leftJoin(matchStatistics, eq(matches.id, matchStatistics.matchId)).where(eq(matches.userId, session.user.id)).orderBy(desc(matches.playedAt))
  const items = rows.map(({ matches: match, match_statistics: stats }) => ({ ...match, ...stats, mapName: match.mapId.replaceAll('-', ' '), playedAt: match.playedAt.toISOString() }))
  const summary = summarize(items)
  return NextResponse.json({ summary: { ...summary, score: summary.score }, matches: items.slice(0, 50).map(m => ({ ...m, score: performanceScore(m), kd: m.deaths == null ? null : (m.deaths === 0 ? m.kills : (m.kills ?? 0) / m.deaths) })) })
}
