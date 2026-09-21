import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ArrowRight, BarChart3, Crosshair, Gauge, LogOut, Target, Trophy } from 'lucide-react'

const metrics = [
  { label: 'Partidas analisadas', value: '0', change: 'Comece registrando uma partida', icon: BarChart3 },
  { label: 'Win rate', value: '—', change: 'Sem dados ainda', icon: Trophy },
  { label: 'K/D ratio', value: '—', change: 'Sem dados ainda', icon: Crosshair },
  { label: 'ADR médio', value: '—', change: 'Sem dados ainda', icon: Gauge },
]

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <main className="min-h-screen bg-[#080b10] text-[#f5f7fa]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <a href="/dashboard" className="flex items-center gap-3" aria-label="Matchlytics dashboard">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1d6cff] shadow-[0_0_28px_rgba(29,108,255,0.35)]"><Target className="size-5" /></span>
          <span className="text-lg font-semibold tracking-[-0.03em]">match<span className="text-[#5c9bff]">lytics</span></span>
        </a>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[#8995a5] sm:inline">Olá, {session.user.name}</span>
          <a href="/api/auth/sign-out" className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#c9d0dc] transition hover:border-white/20 hover:text-white"><LogOut className="size-4" /> Sair</a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-10 lg:px-8">
        <div className="rounded-3xl border border-[#255bbd]/30 bg-[linear-gradient(120deg,#10234a,#0f1724_60%,#111720)] p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7fb0ff]">Seu espaço de evolução</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Jogue mais consciente, {session.user.name.split(' ')[0]}.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#a9b6ca]">Registre sua primeira partida para transformar desempenho em decisões mais claras dentro do servidor.</p>
          <button className="mt-7 rounded-xl bg-[#1d6cff] px-5 py-3.5 text-sm font-semibold shadow-[0_12px_35px_rgba(29,108,255,0.25)] transition hover:bg-[#3b82ff]">Registrar partida <ArrowRight className="ml-2 inline size-4" /></button>
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
            <p className="mt-2 text-sm leading-6 text-[#738094]">Seu gráfico aparecerá aqui quando você registrar partidas.</p>
            <div className="mt-8 flex h-36 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-[#687588]">Aguardando seus dados</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#111720] p-6">
            <p className="text-xs font-medium text-[#c9d0dc]">Partidas recentes</p>
            <p className="mt-2 text-sm leading-6 text-[#738094]">Nenhuma partida registrada ainda.</p>
            <button className="mt-6 text-sm font-semibold text-[#7fb0ff] transition hover:text-white">Adicionar primeira partida <ArrowRight className="ml-1 inline size-4" /></button>
          </div>
        </div>
      </section>
    </main>
  )
}
