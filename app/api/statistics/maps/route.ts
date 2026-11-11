import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { matches, matchStatistics } from '@/lib/db/schema'
import { aggregateMapStats, type MapMatch } from '@/lib/map-analytics'

export async function GET(request: Request) {
  const session = await getSession(await headers())
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const fromValue = params.get('from')
  const toValue = params.get('to')
  const from = fromValue ? new Date(fromValue) : null
  const to = toValue ? new Date(toValue) : null
  if ((fromValue && !Number.isFinite(from?.getTime())) || (toValue && !Number.isFinite(to?.getTime())) || (from && to && from > to)) {
    return NextResponse.json({ error: 'O período informado é inválido.' }, { status: 400 })
  }

  const rows = await db.select().from(matches).leftJoin(matchStatistics, eq(matches.id, matchStatistics.matchId))
    .where(eq(matches.userId, session.user.id))
    .orderBy(desc(matches.playedAt))
  const records = rows.map(({ matches: match, match_statistics: stats }) => ({ ...match, ...stats })) as MapMatch[]
  const maps = aggregateMapStats(records, session.user.id, { from, to }).map(({ mapKey, mapName, ...stats }) => ({ mapKey, mapName, ...stats }))
  return NextResponse.json({ maps })
}
