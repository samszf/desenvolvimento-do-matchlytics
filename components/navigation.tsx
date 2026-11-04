'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Lightbulb, Map, Menu, Plus, Target, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))

  return (
    <header className="relative border-b border-white/8 bg-[#080b10]/95 backdrop-blur">
      <span className="sr-only">Navegação da conta</span>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4 lg:gap-6 lg:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-3" aria-label="Matchlytics dashboard">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1d6cff] shadow-[0_0_28px_rgba(29,108,255,0.35)]"><Target className="size-5" /></span>
          <span className="text-lg font-semibold tracking-[-0.03em]">match<span className="text-[#5c9bff]">lytics</span></span>
        </Link>
        <nav aria-label="Navegação principal" className="hidden min-w-0 flex-1 items-center gap-1 sm:flex">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${isActive(href) ? 'bg-[#1d6cff]/15 font-medium text-[#9bc0ff]' : 'text-[#8995a5] hover:bg-white/[0.04] hover:text-white'}`} aria-current={isActive(href) ? 'page' : undefined}><Icon className="size-4" />{label}</Link>)}
        </nav>
        <div className="ml-auto hidden shrink-0 items-center gap-4 sm:flex">
          {userName && <span className="hidden text-sm text-[#8995a5] lg:inline">Olá, {userName}</span>}
          <LogoutButton />
        </div>
        <Link href="/matches/new" className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1d6cff] px-3 py-2 text-sm font-semibold transition hover:bg-[#3b82ff]" aria-label="Registrar partida"><Plus className="size-4" /><span className="hidden md:inline">Registrar</span></Link>
        <button type="button" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#c9d0dc] transition hover:border-white/20 hover:text-white sm:hidden" aria-expanded={menuOpen} aria-controls="mobile-account-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {menuOpen && <div id="mobile-account-menu" className="absolute inset-x-0 top-full z-50 border-b border-white/10 bg-[#0c1118] p-4 shadow-2xl sm:hidden"><nav aria-label="Navegação mobile" className="grid gap-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${isActive(href) ? 'bg-[#1d6cff]/15 font-medium text-[#9bc0ff]' : 'text-[#c9d0dc] hover:bg-white/[0.04]'}`} aria-current={isActive(href) ? 'page' : undefined}><Icon className="size-4" />{label}</Link>)}<Link href="/matches/new" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[#c9d0dc] hover:bg-white/[0.04]"><Plus className="size-4" />Registrar partida</Link><div className="mt-2 border-t border-white/10 pt-3"><LogoutButton /></div></nav></div>}
    </header>
  )
}

export default Navigation
