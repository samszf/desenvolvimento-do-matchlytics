'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Target } from 'lucide-react'
import { formatMetric } from '@/lib/analytics'
import { Navigation } from '@/components/navigation'

type Overview = { summary: { total:number; winRate:number|null; kd:number|null; adr:number|null; score:number|null }; matches: { playedAt:string; kd:number|null; adr:number|null; score:number; result:string }[] }
export default function AnalysisPage() {
  const [data, setData] = useState<Overview | null>(null)
  useEffect(() => { fetch('/api/statistics/overview').then(r => r.json()).then(setData) }, [])
  const summary = data?.summary
  return <main className="min-h-screen bg-[#080b10] text-[#f5f7fa]"><Navigation/><div className="px-5 py-8 lg:px-10"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#8995a5]"><ArrowLeft className="size-4"/>Dashboard</Link><div className="mt-10 flex items-center gap-3"><BarChart3 className="size-6 text-[#5c9bff]"/><div><p className="text-xs uppercase tracking-[.2em] text-[#7fb0ff]">Análise</p><h1 className="text-4xl font-semibold tracking-tight">Sua evolução</h1></div></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['Partidas',summary?.total ?? 0],['Win Rate',formatMetric(summary?.winRate ?? null,'%')],['K/D',formatMetric(summary?.kd ?? null)],['ADR',formatMetric(summary?.adr ?? null)],['Score',formatMetric(summary?.score ?? null)]].map(([label,value])=><div className="rounded-2xl border border-white/10 bg-[#111720] p-5" key={label as string}><p className="text-xs text-[#8995a5]">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}</div><section className="mt-6 rounded-2xl border border-white/10 bg-[#111720] p-6"><h2 className="flex items-center gap-2 font-medium"><Target className="size-4 text-[#5c9bff]"/>Últimas partidas</h2><div className="mt-5 flex flex-col gap-3">{data?.matches.slice(0,10).map((m,i)=><div className="flex items-center justify-between border-b border-white/5 pb-3 text-sm" key={i}><span className="text-[#8995a5]">{new Date(m.playedAt).toLocaleDateString('pt-BR')}</span><span>K/D {formatMetric(m.kd)} · ADR {formatMetric(m.adr)} · Score {m.score}</span><span className={m.result==='win'?'text-emerald-400': 'text-rose-400'}>{m.result==='win'?'Vitória':'Derrota'}</span></div>) ?? <p className="text-sm text-[#8995a5]">Carregando dados reais...</p>}</div></section></div></div></main>
}
