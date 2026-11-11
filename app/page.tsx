'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Crosshair,
  Gauge,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react'

const metrics = [
  { label: 'Partidas analisadas', value: '128', change: '+12,4%', icon: BarChart3 },
  { label: 'Win rate', value: '58,6%', change: '+4,2%', icon: Trophy },
  { label: 'K/D ratio', value: '1,18', change: '+8,7%', icon: Crosshair },
  { label: 'ADR médio', value: '82,4', change: '+6,1%', icon: Gauge },
]

const matches = [
  { map: 'Mirage', result: 'Vitória', score: '13 : 9', kd: '1,42', adr: '96,2', tone: 'win' },
  { map: 'Ancient', result: 'Vitória', score: '13 : 7', kd: '1,21', adr: '88,6', tone: 'win' },
  { map: 'Inferno', result: 'Derrota', score: '10 : 13', kd: '0,86', adr: '71,3', tone: 'loss' },
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Visão geral')

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen overflow-hidden bg-[#080b10] text-[#f5f7fa]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(44,112,255,0.12),transparent_32%),radial-gradient(circle_at_10%_30%,rgba(29,191,115,0.05),transparent_28%)]" />
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="Matchlytics início">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1965f5] shadow-[0_0_28px_rgba(29,108,255,0.35)]"><Target className="size-5" /></span>
          <span className="text-lg font-semibold tracking-[-0.03em]">match<span className="text-[#5c9bff]">lytics</span></span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-[#9ba5b5] md:flex" aria-label="Navegação principal">
          <a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a>
          <a href="#recursos" className="transition-colors hover:text-white">Recursos</a>
          <a href="#metricas" className="transition-colors hover:text-white">Métricas</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href="/sign-in" className="rounded-lg px-4 py-2 text-sm text-[#c9d0dc] transition hover:text-white">Entrar</a>
          <a href="/sign-up" className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#10151d] transition hover:bg-[#dce8ff]">Começar agora <ArrowRight className="ml-1 inline size-4" /></a>
        </div>
        <button id="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-white/10 p-2 text-[#c9d0dc] md:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>
      {menuOpen && <nav id="mobile-menu" aria-label="Menu móvel" className="relative z-20 mx-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#111720] p-5 text-sm text-[#c9d0dc] md:hidden"><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a href="#metricas">Métricas</a><a href="/sign-up" className="font-semibold text-white">Começar agora <ArrowRight className="inline size-4" /></a></nav>}

      <section id="top" className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-32 lg:pt-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#2d6fe5]/30 bg-[#102348]/55 px-3 py-1.5 text-xs font-medium text-[#83adff]"><Sparkles className="size-3.5" /> Dados que jogam a seu favor</div>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.065em] sm:text-6xl lg:text-[76px]">Entenda seu jogo.<br /><span className="text-[#5c9bff]">Evolua</span> com seus dados.</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#9ba5b5] sm:text-lg">Registre suas partidas de CS2, acompanhe sua evolução e descubra padrões que transformam boas jogadas em consistência.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4"><a id="comecar" href="#dashboard" className="rounded-xl bg-[#1965f5] px-5 py-3.5 text-sm font-semibold shadow-[0_12px_35px_rgba(29,108,255,0.25)] transition hover:bg-[#1458df]">Começar agora <ArrowRight className="ml-2 inline size-4" /></a><a href="#como-funciona" className="rounded-xl border border-white/10 px-5 py-3.5 text-sm font-medium text-[#c9d0dc] transition hover:border-white/20 hover:text-white">Ver como funciona</a></div>
          <div className="mt-10 flex items-center gap-5 text-xs text-[#7c8797]"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#51cf91]" /> Seus dados protegidos</span><span className="flex items-center gap-2"><Check className="size-4 text-[#51cf91]" /> Feito para jogadores</span></div>
        </div>
        <div id="dashboard" className="relative rounded-2xl border border-white/10 bg-[#111720] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:p-4"><div className="rounded-xl border border-white/8 bg-[#0c1118] p-4 sm:p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[#94a0b1]">Performance overview</p><h2 className="mt-1 text-lg font-semibold">Olá, jogador <span className="text-[#5c9bff]">●</span></h2></div><div className="rounded-lg border border-white/8 px-3 py-2 text-xs text-[#9ba5b5]">Últimos 30 dias <ChevronRight className="ml-1 inline size-3" /></div></div><div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(({ label, value, change, icon: Icon }) => <div key={label} className="rounded-xl border border-white/8 bg-[#111923] p-3"><Icon className="mb-3 size-4 text-[#5c9bff]" /><p className="text-[10px] leading-4 text-[#8995a5]">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-[10px] text-[#51cf91]">↗ {change}</p></div>)}</div><div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]"><div className="rounded-xl border border-white/8 bg-[#111923] p-4"><div className="mb-4 flex justify-between"><div><p className="text-xs font-medium">Evolução do K/D</p><p className="mt-1 text-[10px] text-[#8995a5]">Últimas 10 partidas</p></div><span className="text-sm font-semibold text-[#51cf91]">1,18 <span className="text-[10px]">médio</span></span></div><div className="relative h-32"><div className="absolute inset-x-0 top-1/4 border-t border-dashed border-white/8" /><div className="absolute inset-x-0 top-2/4 border-t border-dashed border-white/8" /><div className="absolute inset-x-0 top-3/4 border-t border-dashed border-white/8" /><svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 500 130" preserveAspectRatio="none" aria-label="Gráfico de evolução do K/D"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1965f5" stopOpacity=".3" /><stop offset="1" stopColor="#1965f5" stopOpacity="0" /></linearGradient></defs><path d="M0 105 C35 92, 55 100, 80 82 S125 75, 150 87 S190 70, 220 76 S265 58, 290 66 S330 52, 355 54 S400 35, 430 43 S470 20, 500 28 L500 130 L0 130Z" fill="url(#area)" /><path d="M0 105 C35 92, 55 100, 80 82 S125 75, 150 87 S190 70, 220 76 S265 58, 290 66 S330 52, 355 54 S400 35, 430 43 S470 20, 500 28" fill="none" stroke="#5c9bff" strokeWidth="2.5" /></svg></div><div className="mt-2 flex justify-between text-[9px] text-[#94a0b1]"><span>10 partidas atrás</span><span>Agora</span></div></div><div className="rounded-xl border border-white/8 bg-[#111923] p-4"><p className="text-xs font-medium">Últimas partidas</p><div className="mt-3 flex flex-col gap-3">{matches.map((match) => <div key={match.map} className="flex items-center justify-between border-b border-white/6 pb-3 last:border-0 last:pb-0"><div className="flex items-center gap-2.5"><span className={`size-1.5 rounded-full ${match.tone === 'win' ? 'bg-[#51cf91]' : 'bg-[#ff6b7a]'}`} /><div><p className="text-[11px] font-medium">{match.map}</p><p className="text-[9px] text-[#8995a5]">{match.result} · {match.score}</p></div></div><div className="text-right"><p className="text-[11px] font-medium">{match.kd} <span className="text-[#8995a5]">K/D</span></p><p className="text-[9px] text-[#8995a5]">{match.adr} ADR</p></div></div>)}</div></div></div></div></div>
      </section>

      <section id="como-funciona" className="relative z-10 border-y border-white/6 bg-[#0c1118] px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c9bff]">Feito para evolução</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Seu desempenho, sem achismo.</h2><p className="mt-4 leading-7 text-[#8995a5]">Do primeiro registro ao próximo clutch, o Matchlytics organiza o que importa para você jogar melhor.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{[['01','Registre','Adicione suas partidas em poucos segundos, com estatísticas gerais e por lado.'],['02','Entenda','Visualize evolução, mapas fortes e os pontos que pedem atenção.'],['03','Evolua','Use insights objetivos para transformar dados em decisões dentro do servidor.']].map(([number,title,text]) => <div key={number} className="rounded-2xl border border-white/8 bg-[#111720] p-6"><span className="text-sm font-semibold text-[#5c9bff]">{number}</span><h3 className="mt-12 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#8995a5]">{text}</p></div>)}</div></div></section>

      <section id="recursos" className="relative z-10 mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c9bff]">Tudo em um só lugar</p><h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">As métricas que contam a história do seu jogo.</h2></div><div className="flex gap-2 rounded-xl border border-white/8 bg-[#111720] p-1" role="group" aria-label="Categorias de análise">{['Visão geral','Mapas','CT x TR'].map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-lg px-3 py-2 text-xs transition ${activeTab === tab ? 'bg-[#1965f5] text-white' : 'text-[#8995a5] hover:text-white'}`} aria-pressed={activeTab === tab}>{tab}</button>)}</div></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Performance Score','Uma leitura equilibrada do seu impacto em cada partida.'],['Análise por mapa','Descubra onde seu estilo encontra mais consistência.'],['Evolução real','Compare suas últimas partidas e acompanhe a tendência.'],['Insights acionáveis','Sinais claros para você saber onde focar.']].map(([title,text], index) => <div key={title} className="group rounded-2xl border border-white/8 bg-[#111720] p-5 transition hover:-translate-y-1 hover:border-[#2d6fe5]/50"><div className="flex size-10 items-center justify-center rounded-xl bg-[#172a52] text-[#6ea5ff]"><BarChart3 className="size-5" /></div><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#8995a5]">{text}</p><ChevronRight className="mt-5 size-4 text-[#5c9bff] transition group-hover:translate-x-1" /></div>)}</div></section>

      <section id="metricas" className="relative z-10 mx-5 mb-20 overflow-hidden rounded-3xl border border-[#255bbd]/30 bg-[linear-gradient(120deg,#10234a,#0f1724_60%,#111720)] px-6 py-14 text-center sm:px-12 lg:mx-auto lg:max-w-7xl"><div className="absolute -right-24 -top-28 size-72 rounded-full bg-[#1965f5]/15 blur-3xl" /><p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-[#7fb0ff]">Comece hoje</p><h2 className="relative mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Jogue mais consciente.<br />Evolua mais rápido.</h2><p className="relative mx-auto mt-5 max-w-lg text-sm leading-6 text-[#a9b6ca]">O próximo nível começa quando você consegue enxergar o caminho.</p><a href="/sign-up" className="relative mt-8 inline-block rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#10151d] transition hover:bg-[#dce8ff]">Criar minha conta <ArrowRight className="ml-2 inline size-4" /></a></section>
      <footer className="relative z-10 border-t border-white/6 px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-[#94a0b1] sm:flex-row sm:items-center sm:justify-between"><span className="font-semibold tracking-tight text-[#c9d0dc]">match<span className="text-[#5c9bff]">lytics</span></span><span>Projeto Integrador · Engenharia de Computação UNIVESP</span><span>Performance Score é um indicador experimental.</span></div></footer>
    </main>
  )
}
