'use client'

import { FormEvent, useState } from 'react'
import { Check, Loader2, Plus, X } from 'lucide-react'

export function MatchForm({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setError('')
    const form = new FormData(event.currentTarget)
    const payload: Record<string, FormDataEntryValue | number> = Object.fromEntries(form.entries())
    for (const key of ['playerScore', 'opponentScore', 'kills', 'deaths', 'assists', 'headshots', 'adr']) payload[key] = Number(payload[key])
    const response = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!response.ok) { setError((await response.json()).error ?? 'Não foi possível salvar.'); setStatus('error'); return }
    setStatus('success')
    setTimeout(() => window.location.reload(), 500)
  }

  const input = 'rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#536074] focus:border-[#4c8dff]'
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111720] p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7fb0ff]">Nova análise</p><h2 className="mt-2 text-2xl font-semibold">Registrar partida</h2><p className="mt-1 text-sm text-[#8995a5]">Seus dados ficam vinculados à sua conta.</p></div><button onClick={onClose} aria-label="Fechar formulário" className="rounded-lg p-2 text-[#8995a5] hover:bg-white/5 hover:text-white"><X className="size-5" /></button></div>
      <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-[#a9b6ca]">Mapa<select name="map" required className={input}><option value="Mirage">Mirage</option><option value="Inferno">Inferno</option><option value="Ancient">Ancient</option><option value="Nuke">Nuke</option><option value="Dust 2">Dust 2</option><option value="Anubis">Anubis</option><option value="Vertigo">Vertigo</option></select></label>
        <label className="flex flex-col gap-2 text-xs text-[#a9b6ca]">Data<input name="playedAt" type="date" required className={input} defaultValue={new Date().toISOString().slice(0, 10)} /></label>
        <label className="flex flex-col gap-2 text-xs text-[#a9b6ca]">Resultado<select name="result" required className={input}><option value="win">Vitória</option><option value="loss">Derrota</option><option value="draw">Empate</option></select></label>
        <div className="grid grid-cols-2 gap-3"><label className="flex flex-col gap-2 text-xs text-[#a9b6ca]">Seu placar<input name="playerScore" type="number" min="0" max="99" required className={input} /></label><label className="flex flex-col gap-2 text-xs text-[#a9b6ca]">Adversário<input name="opponentScore" type="number" min="0" max="99" required className={input} /></label></div>
        <div className="sm:col-span-2"><p className="mb-3 text-xs font-medium text-[#c9d0dc]">Estatísticas gerais</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[['kills','Kills'],['deaths','Deaths'],['assists','Assists'],['headshots','Headshots'],['adr','ADR']].map(([name, label]) => <label key={name} className="flex flex-col gap-2 text-xs text-[#a9b6ca]">{label}<input name={name} type="number" min="0" step={name === 'adr' ? '0.1' : '1'} required className={input} /></label>)}</div></div>
        {error && <p role="alert" className="sm:col-span-2 text-sm text-[#ff8f8f]">{error}</p>}
        <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm text-[#a9b6ca] hover:text-white">Cancelar</button><button disabled={status === 'loading' || status === 'success'} className="rounded-lg bg-[#1d6cff] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3b82ff] disabled:opacity-60">{status === 'loading' ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : status === 'success' ? <Check className="mr-2 inline size-4" /> : <Plus className="mr-2 inline size-4" />}{status === 'success' ? 'Salvo' : 'Salvar partida'}</button></div>
      </form>
    </div>
  </div>
}
