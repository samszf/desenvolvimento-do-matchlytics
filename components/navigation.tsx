'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Lightbulb, Map, Plus, Target } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'

const links = [
  { href: '/dashboard', label: 'Visão geral', icon: BarChart3 },
  { href: '/matches', label: 'Partidas', icon: Target },
  { href: '/analysis', label: 'Análise', icon: BarChart3 },
  { href: '/maps', label: 'Mapas', icon: Map },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
]

export function Navigation({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <header className="border-b border-white/8 bg-[#080b10]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4 lg:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-3" aria-label="Matchlytics dashboard">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1d6cff] shadow-[0_0_28px_rgba(29,108,255,0.35)]"><Target className="size-5" /></span>
          <span className="text-lg font-semibold tracking-[-0.03em]">match<span className="text-[#5c9bff]">lytics</span></span>
        </Link>
        <nav aria-label="Navegação principal" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
            return <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-[#1d6cff]/15 font-medium text-[#9bc0ff]' : 'text-[#8995a5] hover:bg-white/[0.04] hover:text-white'}`} aria-current={active ? 'page' : undefined}><Icon className="size-4" />{label}</Link>
          })}
        </nav>
        <div className="hidden shrink-0 items-center gap-4 sm:flex">
          {userName && <span className="hidden text-sm text-[#8995a5] lg:inline">Olá, {userName}</span>}
          {userName && <LogoutButton />}
        </div>
        <Link href="/matches/new" className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1d6cff] px-3 py-2 text-sm font-semibold transition hover:bg-[#3b82ff]" aria-label="Registrar partida"><Plus className="size-4" /><span className="hidden md:inline">Registrar</span></Link>
      </div>
    </header>
  )
}

export default Navigation
