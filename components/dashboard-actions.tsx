'use client'

import { useState } from 'react'
import { MatchForm } from '@/components/match-form'
import { ArrowRight, Plus } from 'lucide-react'

export function DashboardActions() {
  const [open, setOpen] = useState(false)
  return <>
    <button onClick={() => setOpen(true)} className="mt-7 rounded-xl bg-[#1965f5] px-5 py-3.5 text-sm font-semibold shadow-[0_12px_35px_rgba(29,108,255,0.25)] transition hover:bg-[#1458df]"><Plus className="mr-2 inline size-4" />Registrar partida <ArrowRight className="ml-2 inline size-4" /></button>
    {open && <MatchForm onClose={() => setOpen(false)} />}
  </>
}
