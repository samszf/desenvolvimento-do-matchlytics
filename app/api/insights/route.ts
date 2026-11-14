import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { matches, matchStatistics } from '@/lib/db/schema'
import { buildInsights } from '@/lib/analytics'
import { normalizeMapName } from '@/lib/maps'
export async function GET() {
  const session = await getSession(await headers())
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const rows = await db.select().from(matches).leftJoin(matchStatistics, eq(matches.id, matchStatistics.matchId)).where(eq(matches.userId, session.user.id)).orderBy(desc(matches.playedAt))
  const data = rows.reverse().map(({ matches: m, match_statistics: s }) => ({ ...m, ...s, mapKey: normalizeMapName(m.mapId).key, mapName: normalizeMapName(m.mapId).name }))
  return NextResponse.json({ insights: buildInsights(data), sampleSize: data.length })
}
