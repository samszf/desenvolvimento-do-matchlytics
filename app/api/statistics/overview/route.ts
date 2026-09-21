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
  const sideSummary = (side: 'ct' | 'tr') => {
    const kills = items.reduce((sum, m) => sum + (Number(m[`${side}Kills` as keyof typeof m]) || 0), 0)
    const deaths = items.reduce((sum, m) => sum + (Number(m[`${side}Deaths` as keyof typeof m]) || 0), 0)
    const adrs = items.map(m => Number(m[`${side}Adr` as keyof typeof m])).filter(Number.isFinite)
    return { kills, deaths, assists: items.reduce((sum, m) => sum + (Number(m[`${side}Assists` as keyof typeof m]) || 0), 0), headshots: items.reduce((sum, m) => sum + (Number(m[`${side}Headshots` as keyof typeof m]) || 0), 0), adr: adrs.length ? adrs.reduce((a, b) => a + b, 0) / adrs.length : null, kd: deaths ? kills / deaths : kills ? kills : null }
  }
  return NextResponse.json({ summary: { ...summary, score: summary.score }, sides: { ct: sideSummary('ct'), tr: sideSummary('tr') }, matches: items.slice(0, 50).map(m => ({ ...m, score: performanceScore(m), kd: m.deaths == null ? null : (m.deaths === 0 ? m.kills : (m.kills ?? 0) / m.deaths) })) })
}
