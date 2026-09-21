import { NextResponse } from 'next/server'
import { z } from 'zod'
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
})

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
    assists: data.assists, headshots: data.headshots, adr: String(data.adr),
  })
  return NextResponse.json({ id: matchId }, { status: 201 })
}
