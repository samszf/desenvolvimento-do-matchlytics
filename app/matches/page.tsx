import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CalendarDays, ChevronRight, Crosshair, Plus, Trophy } from 'lucide-react'
import { auth } from '@/lib/auth'
import { Navigation } from '@/components/navigation'
import { db } from '@/lib/db'
import { matchStatistics, matches } from '@/lib/db/schema'

const mapNames: Record<string, string> = {
  mirage: 'Mirage', inferno: 'Inferno', ancient: 'Ancient', nuke: 'Nuke',
  'dust-2': 'Dust 2', anubis: 'Anubis', vertigo: 'Vertigo',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export default async function MatchesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const rows = await db.select({ match: matches, stats: matchStatistics })
    .from(matches)
    .leftJoin(matchStatistics, eq(matchStatistics.matchId, matches.id))
    .where(eq(matches.userId, session.user.id))
    .orderBy(desc(matches.playedAt))

  return (
    <><Navigation />
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#080b10] text-[#f5f7fa]">

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7fb0ff]">Seu histórico</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Partidas</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#8995a5]">Revise seus resultados e acompanhe os números que definem sua evolução.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row"><a href="/matches/import" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:border-[#4c8dff] hover:text-[#9bc0ff]">Importar partida</a><a href="/matches/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d6cff] px-4 py-3 text-sm font-semibold transition hover:bg-[#3b82ff]"><Plus className="size-4" /> Nova partida</a></div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-[#111720]">
          <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_24px] gap-4 border-b border-white/8 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#687588] md:grid"><span>Partida</span><span>Resultado</span><span>K/D</span><span>ADR</span><span>Score</span><span /></div>
          {rows.length === 0 ? <div className="flex flex-col items-center justify-center px-6 py-20 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-[#1d6cff]/10 text-[#5c9bff]"><Crosshair className="size-6" /></span><h2 className="mt-5 text-lg font-semibold">Nenhuma partida registrada</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#8995a5]">Adicione sua primeira partida para começar a identificar padrões no seu desempenho.</p><a href="/matches/new" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:border-[#4c8dff] hover:text-[#9bc0ff]"><Plus className="size-4" /> Adicionar partida</a></div> : rows.map(({ match, stats }) => {
            const kd = stats?.deaths ? ((stats.kills ?? 0) / stats.deaths).toFixed(2) : '—'
            return <a href={`/matches/${match.id}`} key={match.id} className="grid gap-3 border-b border-white/6 px-5 py-5 transition last:border-0 hover:bg-white/[0.025] md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_24px] md:items-center md:gap-4 md:px-6"><div><div className="flex items-center gap-3"><span className="font-medium">{mapNames[match.mapId] ?? match.mapId}</span><span className="text-xs text-[#687588]">{formatDate(match.playedAt)}</span></div><div className="mt-1 flex items-center gap-2 text-xs text-[#687588]"><CalendarDays className="size-3" /> {match.playerScore} : {match.opponentScore}</div></div><span className={`flex items-center gap-2 text-sm font-medium ${match.result === 'win' ? 'text-[#68d391]' : match.result === 'loss' ? 'text-[#ff8f8f]' : 'text-[#f2c66d]'}`}><Trophy className="size-4" /> {match.result === 'win' ? 'Vitória' : match.result === 'loss' ? 'Derrota' : 'Empate'}</span><span className="text-sm text-[#c9d0dc] md:text-base">{kd}</span><span className="text-sm text-[#c9d0dc] md:text-base">{stats?.adr ? `${stats.adr}` : '—'}</span><span className="text-sm text-[#8995a5]">Em breve</span><ChevronRight className="hidden size-4 text-[#687588] md:block" /></a>
          })}
        </div>
      </section>
    </main>
    </>
  )
}
