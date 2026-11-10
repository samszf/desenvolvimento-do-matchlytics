import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { matches, matchStatistics } from '@/lib/db/schema'
import { summarize, performanceScore } from '@/lib/analytics'
export async function GET() {
  const session = await getSession(await headers())
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const rows = await db.select().from(matches).leftJoin(matchStatistics, eq(matches.id, matchStatistics.matchId)).where(eq(matches.userId, session.user.id)).orderBy(desc(matches.playedAt))
  const groups = new Map<string, any[]>()
  rows.forEach(({ matches: m, match_statistics: s }) => { const key = m.mapId.replaceAll('-', ' '); groups.set(key, [...(groups.get(key) ?? []), { ...m, ...s }]) })
  return NextResponse.json({ maps: [...groups.entries()].map(([name, data]) => ({ name, ...summarize(data), score: data.reduce((a, m) => a + performanceScore(m), 0) / data.length })).sort((a, b) => b.total - a.total) })
}
