import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { DashboardActions } from '@/components/dashboard-actions'
import { ArrowRight, BarChart3, Crosshair, Gauge, Trophy } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { matchStatistics, matches } from '@/lib/db/schema'
import { formatMetric, performanceScore, ratio, summarize } from '@/lib/analytics'
import { KDChart, type KDPoint } from '@/components/kd-chart'

const mapNames: Record<string, string> = { mirage: 'Mirage', inferno: 'Inferno', ancient: 'Ancient', nuke: 'Nuke', 'dust-2': 'Dust 2', anubis: 'Anubis', vertigo: 'Vertigo' }

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const rows = await db.select().from(matches).leftJoin(matchStatistics, eq(matches.id, matchStatistics.matchId)).where(eq(matches.userId, session.user.id)).orderBy(desc(matches.playedAt))
  const items = rows.map(({ matches: match, match_statistics: stats }) => ({ ...match, ...stats }))
  const summary = summarize(items)
  const kdData: KDPoint[] = items.slice(0, 8).reverse().map((item, index) => ({
    label: `${index + 1}`,
    kd: ratio(Number(item.kills), Number(item.deaths)) ?? 0,
  }))
  const metrics = [
    { label: 'Partidas analisadas', value: String(summary.total), change: summary.total ? 'Dados atualizados agora' : 'Comece registrando uma partida', icon: BarChart3 },
    { label: 'Win rate', value: formatMetric(summary.winRate, '%'), change: summary.total ? `${summary.wins} vitórias registradas` : 'Sem dados ainda', icon: Trophy },
    { label: 'K/D ratio', value: formatMetric(summary.kd), change: summary.total ? 'Média de todas as partidas' : 'Sem dados ainda', icon: Crosshair },
    { label: 'ADR médio', value: formatMetric(summary.adr), change: summary.total ? 'Dano médio por rodada' : 'Sem dados ainda', icon: Gauge },
    { label: 'Performance Score', value: formatMetric(summary.score), change: summary.total ? 'Média baseada na fórmula Matchlytics' : 'Sem dados ainda', icon: Gauge },
  ]

  return (
    <><Navigation userName={session.user.name} />
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#080b10] text-[#f5f7fa]">

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-10 lg:px-8">
        <div className="rounded-3xl border border-[#255bbd]/30 bg-[linear-gradient(120deg,#10234a,#0f1724_60%,#111720)] p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7fb0ff]">Seu espaço de evolução</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Jogue mais consciente, {session.user.name.split(' ')[0]}.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#a9b6ca]">Registre sua primeira partida para transformar desempenho em decisões mais claras dentro do servidor.</p>
          <DashboardActions />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(({ label, value, change, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-[#111720] p-4 sm:p-5">
              <Icon className="mb-5 size-4 text-[#5c9bff]" />
              <p className="text-xs leading-4 text-[#738094]">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-2 text-[11px] text-[#8995a5]">{change}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/8 bg-[#111720] p-6">
            <p className="text-xs font-medium text-[#c9d0dc]">Evolução do K/D</p>
            <p className="mt-2 text-sm leading-6 text-[#738094]">Acompanhe seus últimos resultados e identifique mudanças no desempenho.</p>
            <div className="mt-8 rounded-xl border border-white/8 bg-[#0c1118] p-4 sm:p-5">
              <KDChart data={kdData} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#111720] p-6">
            <p className="text-xs font-medium text-[#c9d0dc]">Partidas recentes</p>
            {items.length ? <div className="mt-5 flex flex-col gap-3">{items.slice(0, 3).map((item) => <a href={`/matches/${item.id}`} key={item.id} className="flex items-center justify-between rounded-lg border border-white/6 px-3 py-2.5 text-sm transition hover:bg-white/[0.03]"><span><span className="font-medium">{mapNames[item.mapId] ?? item.mapId}</span><span className="ml-2 text-xs text-[#94a0b1]">{item.playerScore}:{item.opponentScore}</span></span><span className={item.result === 'win' ? 'text-[#68d391]' : item.result === 'loss' ? 'text-[#ff8f8f]' : 'text-[#f2c66d]'}>{item.result === 'win' ? 'Vitória' : item.result === 'loss' ? 'Derrota' : 'Empate'}</span></a>)}</div> : <p className="mt-2 text-sm leading-6 text-[#738094]">Nenhuma partida registrada ainda.</p>}
            <a href={items.length ? '/matches' : '/matches/new'} className="mt-6 inline-block text-sm font-semibold text-[#7fb0ff] transition hover:text-white">{items.length ? 'Ver histórico completo' : 'Adicionar primeira partida'} <ArrowRight className="ml-1 inline size-4" /></a>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}
