import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { matchStatistics, matches } from '@/lib/db/schema'

const matchSchema = z.object({
  map: z.string().min(2).max(40),
  playedAt: z.coerce.date(),
  result: z.enum(['win', 'loss', 'draw']),
  playerScore: z.number().int().min(0).max(99),
  opponentScore: z.number().int().min(0).max(99),
  kills: z.number().int().min(0).max(200),
  deaths: z.number().int().min(0).max(200),
  assists: z.number().int().min(0).max(200),
  headshots: z.number().int().min(0).max(200),
  adr: z.number().min(0).max(300),
  kast: z.number().min(0).max(100).optional(),
  ctKills: z.number().int().min(0).max(200), ctDeaths: z.number().int().min(0).max(200), ctAssists: z.number().int().min(0).max(200), ctHeadshots: z.number().int().min(0).max(200), ctAdr: z.number().min(0).max(300),
  trKills: z.number().int().min(0).max(200), trDeaths: z.number().int().min(0).max(200), trAssists: z.number().int().min(0).max(200), trHeadshots: z.number().int().min(0).max(200), trAdr: z.number().min(0).max(300),
}).refine((data) => data.headshots <= data.kills, { message: 'Headshots não pode ser maior que Kills.' }).refine((data) => data.ctHeadshots <= data.ctKills && data.trHeadshots <= data.trKills, { message: 'Headshots por lado não pode ser maior que Kills.' }).refine((data) => data.ctKills + data.trKills === data.kills && data.ctDeaths + data.trDeaths === data.deaths && data.ctAssists + data.trAssists === data.assists && data.ctHeadshots + data.trHeadshots === data.headshots || [data.ctKills, data.ctDeaths, data.ctAssists, data.ctHeadshots, data.trKills, data.trDeaths, data.trAssists, data.trHeadshots].every((value) => value === 0), { message: 'As estatísticas CT/TR não conferem com os totais gerais.' })

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const rows = await db.select({ match: matches, stats: matchStatistics })
    .from(matches)
    .leftJoin(matchStatistics, eq(matchStatistics.matchId, matches.id))
    .where(eq(matches.userId, session.user.id))
    .orderBy(desc(matches.playedAt))

  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = matchSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Confira os dados informados.' }, { status: 400 })

  const data = parsed.data
  const matchId = crypto.randomUUID()
  await db.insert(matches).values({
    id: matchId,
    userId: session.user.id,
    mapId: data.map.toLowerCase().replaceAll(' ', '-'),
    playedAt: data.playedAt,
    result: data.result,
    playerScore: data.playerScore,
    opponentScore: data.opponentScore,
  })
  await db.insert(matchStatistics).values({
    id: crypto.randomUUID(), matchId, kills: data.kills, deaths: data.deaths,
    assists: data.assists, headshots: data.headshots, adr: String(data.adr), kast: data.kast == null ? null : String(data.kast),
    ctKills: data.ctKills, ctDeaths: data.ctDeaths, ctAssists: data.ctAssists, ctHeadshots: data.ctHeadshots, ctAdr: String(data.ctAdr),
    trKills: data.trKills, trDeaths: data.trDeaths, trAssists: data.trAssists, trHeadshots: data.trHeadshots, trAdr: String(data.trAdr),
  })
  return NextResponse.json({ id: matchId }, { status: 201 })
}
