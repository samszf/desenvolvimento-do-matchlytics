import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { matchStatistics, matches } from '@/lib/db/schema'

const updateSchema = z.object({
  map: z.string().min(2).max(40).optional(),
  playedAt: z.coerce.date().optional(),
  result: z.enum(['win', 'loss', 'draw']).optional(),
  playerScore: z.number().int().min(0).max(99).optional(),
  opponentScore: z.number().int().min(0).max(99).optional(),
  kills: z.number().int().min(0).max(200).optional(),
  deaths: z.number().int().min(0).max(200).optional(),
  assists: z.number().int().min(0).max(200).optional(),
  headshots: z.number().int().min(0).max(200).optional(),
  adr: z.number().min(0).max(300).optional(),
  kast: z.number().min(0).max(100).optional(),
  ctKills: z.number().int().min(0).max(200).optional(), ctDeaths: z.number().int().min(0).max(200).optional(), ctAssists: z.number().int().min(0).max(200).optional(), ctHeadshots: z.number().int().min(0).max(200).optional(), ctAdr: z.number().min(0).max(300).optional(),
  trKills: z.number().int().min(0).max(200).optional(), trDeaths: z.number().int().min(0).max(200).optional(), trAssists: z.number().int().min(0).max(200).optional(), trHeadshots: z.number().int().min(0).max(200).optional(), trAdr: z.number().min(0).max(300).optional(),
})

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const rows = await db.select({ match: matches, stats: matchStatistics })
    .from(matches)
    .leftJoin(matchStatistics, eq(matchStatistics.matchId, matches.id))
    .where(and(eq(matches.id, id), eq(matches.userId, session.user.id)))
  if (!rows[0]) return NextResponse.json({ error: 'Partida não encontrada.' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Confira os dados informados.' }, { status: 400 })
  const data = parsed.data
  const matchUpdate = {
    ...(data.map === undefined ? {} : { mapId: data.map.toLowerCase().replaceAll(' ', '-') }),
    ...(data.playedAt === undefined ? {} : { playedAt: data.playedAt }),
    ...(data.result === undefined ? {} : { result: data.result }),
    ...(data.playerScore === undefined ? {} : { playerScore: data.playerScore }),
    ...(data.opponentScore === undefined ? {} : { opponentScore: data.opponentScore }),
    updatedAt: new Date(),
  }
  const statsUpdate = {
    ...(data.kills === undefined ? {} : { kills: data.kills }),
    ...(data.deaths === undefined ? {} : { deaths: data.deaths }),
    ...(data.assists === undefined ? {} : { assists: data.assists }),
    ...(data.headshots === undefined ? {} : { headshots: data.headshots }),
    ...(data.adr === undefined ? {} : { adr: String(data.adr) }),
    ...(data.kast === undefined ? {} : { kast: String(data.kast) }),
    ...(data.ctKills === undefined ? {} : { ctKills: data.ctKills }), ...(data.ctDeaths === undefined ? {} : { ctDeaths: data.ctDeaths }), ...(data.ctAssists === undefined ? {} : { ctAssists: data.ctAssists }), ...(data.ctHeadshots === undefined ? {} : { ctHeadshots: data.ctHeadshots }), ...(data.ctAdr === undefined ? {} : { ctAdr: String(data.ctAdr) }),
    ...(data.trKills === undefined ? {} : { trKills: data.trKills }), ...(data.trDeaths === undefined ? {} : { trDeaths: data.trDeaths }), ...(data.trAssists === undefined ? {} : { trAssists: data.trAssists }), ...(data.trHeadshots === undefined ? {} : { trHeadshots: data.trHeadshots }), ...(data.trAdr === undefined ? {} : { trAdr: String(data.trAdr) }),
  }
  const result = await db.update(matches).set(matchUpdate).where(and(eq(matches.id, id), eq(matches.userId, session.user.id))).returning({ id: matches.id })
  if (!result[0]) return NextResponse.json({ error: 'Partida não encontrada.' }, { status: 404 })
  if (Object.keys(statsUpdate).length) await db.update(matchStatistics).set(statsUpdate).where(eq(matchStatistics.matchId, id))
  return NextResponse.json({ id })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const result = await db.delete(matches).where(and(eq(matches.id, id), eq(matches.userId, session.user.id))).returning({ id: matches.id })
  if (!result[0]) return NextResponse.json({ error: 'Partida não encontrada.' }, { status: 404 })
  await db.delete(matchStatistics).where(eq(matchStatistics.matchId, id))
  return new NextResponse(null, { status: 204 })
}
