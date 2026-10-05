'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { CheckCircle2, FileUp, Loader2, UploadCloud } from 'lucide-react'
import type { ImportedMatch } from '@/lib/demo-parser'

const input = 'w-full rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2.5 text-sm text-white outline-none focus:border-[#4c8dff]'
function calculateImportedMetrics(stats: ImportedMatch['stats']) { const kills = stats.kills ?? 0; const deaths = stats.deaths ?? 0; return { kd: deaths ? kills / deaths : null, hsPercent: kills ? ((stats.headshots ?? 0) / kills) * 100 : null } }

export function DemoImportForm() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ImportedMatch | null>(null)
  const [player, setPlayer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('draw')
  const [playerScore, setPlayerScore] = useState('')
  const [opponentScore, setOpponentScore] = useState('')
  const [adr, setAdr] = useState('')
  const [kast, setKast] = useState('')
  function choose(next: File | undefined) { if (!next) return; if (!next.name.toLowerCase().endsWith('.dem')) { setError('Selecione somente arquivos .dem.'); return }; setFile(next); setData(null); setError('') }
  async function analyze() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const blob = await upload(`demos/${file.name}`, file, {
        access: 'private',
        handleUploadUrl: '/api/matches/import/upload',
      })
      const response = await fetch('/api/matches/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathname: blob.pathname }),
      })
      const contentType = response.headers.get('content-type') ?? ''
      const payload = contentType.includes('application/json') ? await response.json() : null
      if (!response.ok) {
        setError(payload?.error ?? `Não foi possível analisar esta demo (erro ${response.status}).`)
      } else if (!payload) {
        setError('O servidor não retornou uma resposta válida para esta demo.')
      } else {
        setData(payload)
        setPlayer(payload.players?.[0]?.steamId ?? '')
      }
    } catch {
      setError('Não foi possível conectar ao analisador. Tente novamente com uma demo menor ou verifique se o arquivo .dem está válido.')
    } finally {
      setLoading(false)
    }
  }
  async function confirm() { if (!data || !player) return; const stats = data.stats; if ([stats.kills, stats.deaths, stats.assists, stats.headshots].some((value) => value == null)) { setError('Revise os dados manualmente: a demo não forneceu estatísticas suficientes.'); return }; const response = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ map: data.map ?? 'Desconhecido', playedAt: data.playedAt ?? new Date().toISOString(), result, playerScore: Number(playerScore), opponentScore: Number(opponentScore), kills: stats.kills, deaths: stats.deaths, assists: stats.assists, headshots: stats.headshots, adr: Number(adr), kast: kast ? Number(kast) : undefined, ctKills: 0, ctDeaths: 0, ctAssists: 0, ctHeadshots: 0, ctAdr: 0, trKills: 0, trDeaths: 0, trAssists: 0, trHeadshots: 0, trAdr: 0 }) }); if (!response.ok) { setError((await response.json()).error ?? 'Não foi possível importar a partida.'); return }; window.location.href = '/matches' }
  const metrics = data ? calculateImportedMetrics(data.stats) : null
  return <section className="mt-8 rounded-2xl border border-white/10 bg-[#111720] p-5 sm:p-7"><div aria-live="polite" className="sr-only">{loading ? 'Analisando sua partida...' : data ? 'Partida analisada com sucesso.' : ''}</div><div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); choose(event.dataTransfer.files[0]) }} className="rounded-2xl border border-dashed border-[#4c8dff]/50 bg-[#0c1118] p-10 text-center"><UploadCloud className="mx-auto size-10 text-[#6ea5ff]" /><h2 className="mt-4 text-xl font-semibold">Arraste sua demo do CS2 aqui</h2><p className="mt-2 text-sm text-[#8995a5]">ou selecione um arquivo .dem de até 300 MB</p><input ref={inputRef} className="sr-only" type="file" accept=".dem,application/octet-stream" onChange={(event) => choose(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1d6cff] px-4 py-3 text-sm font-semibold"><FileUp className="size-4" /> Selecionar arquivo</button>{file && <p className="mt-4 text-sm text-[#b7c2d3]">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}</div>{file && !data && <button type="button" disabled={loading} onClick={analyze} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold disabled:opacity-60">{loading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} {loading ? 'Analisando sua partida...' : 'Analisar demo'}</button>}{data && <div className="mt-7 flex flex-col gap-5"><div className="flex items-center gap-2 text-[#68d391]"><CheckCircle2 className="size-5" /> Partida analisada com sucesso.</div><div><label className="text-sm font-semibold" htmlFor="demo-player">Quem é você nesta partida?</label><select id="demo-player" value={player} onChange={(event) => setPlayer(event.target.value)} className={`${input} mt-2`}>{data.players.map((item) => <option key={item.steamId} value={item.steamId}>{item.name}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-4">{[['Mapa', data.map ?? 'Indisponível'], ['Kills', data.stats.kills ?? 'Indisponível'], ['Deaths', data.stats.deaths ?? 'Indisponível'], ['K/D', metrics?.kd == null ? 'Indisponível' : metrics.kd.toFixed(2)]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/8 bg-[#0c1118] p-4"><p className="text-xs text-[#8995a5]">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>)}</div>{data.warnings.map((warning) => <p key={warning} className="text-sm text-[#f2c66d]">{warning}</p>)}<p className="text-xs text-[#8995a5]">Dados obtidos automaticamente da demo. Revise os campos abaixo antes de confirmar; valores ausentes não são estimados.</p><div className="grid gap-3 sm:grid-cols-4"><label className="text-xs text-[#b7c2d3]">Resultado<select value={result} onChange={(event) => setResult(event.target.value)} className={`${input} mt-2`}><option value="win">Vitória</option><option value="loss">Derrota</option><option value="draw">Empate</option></select></label><label className="text-xs text-[#b7c2d3]">Seu placar<input required value={playerScore} onChange={(event) => setPlayerScore(event.target.value)} type="number" min="0" className={`${input} mt-2`} /></label><label className="text-xs text-[#b7c2d3]">Adversário<input required value={opponentScore} onChange={(event) => setOpponentScore(event.target.value)} type="number" min="0" className={`${input} mt-2`} /></label><label className="text-xs text-[#b7c2d3]">ADR<input required value={adr} onChange={(event) => setAdr(event.target.value)} type="number" min="0" step="0.1" className={`${input} mt-2`} /></label></div><label className="block text-xs text-[#b7c2d3]">KAST (opcional)<input value={kast} onChange={(event) => setKast(event.target.value)} type="number" min="0" max="100" step="0.1" className={`${input} mt-2`} /></label><button type="button" onClick={confirm} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#1d6cff] px-4 py-3 text-sm font-semibold">Importar partida</button></div>}{error && <p role="alert" className="mt-4 text-sm text-[#ff9b9b]">{error}</p>}</section>
}
