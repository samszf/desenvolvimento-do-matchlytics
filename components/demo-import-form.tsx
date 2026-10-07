'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { CheckCircle2, FileUp, Loader2, UploadCloud } from 'lucide-react'
import type { ImportedMatch, ImportedPlayer, ImportedStats } from '@/lib/demo-parser'

const input = 'w-full rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2.5 text-sm text-white outline-none focus:border-[#4c8dff]'

function format(value: number | null | undefined, digits = 0) {
  return value == null ? 'Indisponível' : digits ? value.toFixed(digits) : String(value)
}

function StatGrid({ stats }: { stats: ImportedStats }) {
  const values = [
    ['Kills', format(stats.kills)], ['Deaths', format(stats.deaths)], ['Assists', format(stats.assists)],
    ['Headshots', format(stats.headshots)], ['K/D', format(stats.kd, 2)], ['HS%', stats.hsPercentage == null ? 'Indisponível' : `${stats.hsPercentage.toFixed(1)}%`],
  ]
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{values.map(([label, value]) => <div key={label} className="rounded-xl border border-white/8 bg-[#0c1118] p-4"><p className="text-xs text-[#8995a5]">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>)}</div>
}

function PlayerRow({ item, selected, onSelect }: { item: ImportedPlayer; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`grid w-full grid-cols-3 items-center gap-3 rounded-xl border p-4 text-left transition sm:grid-cols-8 ${selected ? 'border-[#4c8dff] bg-[#13294f]' : 'border-white/8 bg-[#0c1118] hover:border-white/20'}`}><span className="col-span-2 min-w-0 truncate font-medium text-white sm:col-span-2">{selected ? '✓ ' : ''}{item.name}</span><span className="text-xs text-[#8995a5]">{item.team ?? '—'}</span><span className="hidden text-center text-sm sm:block">{format(item.stats.kills)}</span><span className="hidden text-center text-sm sm:block">{format(item.stats.deaths)}</span><span className="hidden text-center text-sm sm:block">{format(item.stats.assists)}</span><span className="hidden text-center text-sm sm:block">{format(item.stats.headshots)}</span><span className="text-right text-sm font-semibold text-[#9bc0ff]">{format(item.stats.kd, 2)}</span></button>
}

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

  function choose(next?: File) { if (!next) return; if (!next.name.toLowerCase().endsWith('.dem')) { setError('Selecione somente arquivos .dem.'); return }; setFile(next); setData(null); setPlayer(''); setError('') }
  async function analyze() {
    if (!file) return
    setLoading(true); setError('')
    try {
      const blob = await upload(`demos/${file.name}`, file, { access: 'private', contentType: 'application/octet-stream', handleUploadUrl: '/api/matches/import/upload' })
      const response = await fetch('/api/matches/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pathname: blob.pathname }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload) throw new Error(payload?.error ?? `Falha ao analisar demo (${response.status})`)
      if (!payload.players?.length) setError('Não foi possível identificar jogadores nesta demo.')
      else { setData(payload); setPlayer('') }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const normalized = message.toLowerCase()
      setError(normalized.includes('unreachable') || normalized.includes('wasm trap') ? 'O analisador foi iniciado, mas esta demo não pôde ser lida. Use um arquivo .dem válido do CS2 (de preferência uma demo recém-gravada).' : message || 'Não foi possível analisar esta demo. Verifique se o arquivo é uma demo válida do Counter-Strike 2.')
    } finally { setLoading(false) }
  }

  const selectedPlayer = data?.players.find((item) => item.steamId === player) ?? null
  const selectedStats = selectedPlayer?.stats ?? null
  async function confirm() {
    if (!data || !selectedPlayer || !selectedStats) return
    if ([selectedStats.kills, selectedStats.deaths, selectedStats.assists, selectedStats.headshots].some((value) => value == null)) { setError('Revise os dados: a demo não forneceu estatísticas suficientes.'); return }
    const response = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ map: data.map ?? 'Desconhecido', playedAt: data.playedAt ?? new Date().toISOString(), result, playerScore: Number(playerScore), opponentScore: Number(opponentScore), kills: selectedStats.kills, deaths: selectedStats.deaths, assists: selectedStats.assists, headshots: selectedStats.headshots, adr: Number(adr), kast: kast ? Number(kast) : undefined, ctKills: 0, ctDeaths: 0, ctAssists: 0, ctHeadshots: 0, ctAdr: 0, trKills: 0, trDeaths: 0, trAssists: 0, trHeadshots: 0, trAdr: 0 }) })
    if (!response.ok) { setError((await response.json()).error ?? 'Não foi possível importar a partida.'); return }
    window.location.href = '/matches'
  }

  return <section className="mt-8 rounded-2xl border border-white/10 bg-[#111720] p-5 sm:p-7"><div aria-live="polite" className="sr-only">{loading ? 'Analisando sua partida...' : data ? 'Partida analisada com sucesso.' : ''}</div><div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); choose(event.dataTransfer.files[0]) }} className="rounded-2xl border border-dashed border-[#4c8dff]/50 bg-[#0c1118] p-10 text-center"><UploadCloud className="mx-auto size-10 text-[#6ea5ff]" /><h2 className="mt-4 text-xl font-semibold">Arraste sua demo do CS2 aqui</h2><p className="mt-2 text-sm text-[#8995a5]">ou selecione um arquivo .dem de até 300 MB</p><input ref={inputRef} className="sr-only" type="file" accept=".dem,application/octet-stream" onChange={(event) => choose(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1d6cff] px-4 py-3 text-sm font-semibold"><FileUp className="size-4" /> Selecionar arquivo</button>{file && <p className="mt-4 text-sm text-[#b7c2d3]">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}</div>{file && !data && <button type="button" disabled={loading} onClick={analyze} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold disabled:opacity-60">{loading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} {loading ? 'Analisando sua partida...' : 'Analisar demo'}</button>}{error && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{data && <div className="mt-7 flex flex-col gap-6"><div className="flex items-center gap-2 text-[#68d391]"><CheckCircle2 className="size-5" /> Partida analisada com sucesso.</div><div><label className="text-sm font-semibold" htmlFor="demo-player">Quem é você nesta partida?</label><select id="demo-player" value={player} onChange={(event) => setPlayer(event.target.value)} className={`${input} mt-2`}>{data.players.map((item) => <option key={item.steamId} value={item.steamId}>{item.name} · {item.team ?? 'Time não identificado'}</option>)}</select></div><div><h3 className="text-lg font-semibold">Jogadores encontrados</h3><div className="mt-3 hidden grid-cols-8 gap-3 px-4 text-xs uppercase tracking-wider text-[#8995a5] sm:grid"><span className="col-span-2">Jogador</span><span>Time</span><span className="text-center">K</span><span className="text-center">D</span><span className="text-center">A</span><span className="text-center">HS</span><span className="text-right">K/D</span></div><div className="mt-2 space-y-2">{data.players.map((item) => <PlayerRow key={item.steamId} item={item} selected={item.steamId === player} onSelect={() => setPlayer(item.steamId)} />)}</div></div>{selectedPlayer && selectedStats && <div className="rounded-2xl border border-[#4c8dff]/30 bg-[#10234a] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#9bc0ff]">Seu desempenho importado</p><div className="mt-2 flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-xl font-semibold text-white">{selectedPlayer.name}</h3><span className="text-sm text-[#b7c2d3]">Time: {selectedPlayer.team ?? 'não identificado'}</span></div><div className="mt-5"><StatGrid stats={selectedStats} /></div></div>}<div className="grid gap-3 sm:grid-cols-4"><label className="text-xs text-[#b7c2d3]">Resultado<select value={result} onChange={(event) => setResult(event.target.value)} className={`${input} mt-2`}><option value="win">Vitória</option><option value="loss">Derrota</option><option value="draw">Empate</option></select></label><label className="text-xs text-[#b7c2d3]">Seu placar<input required value={playerScore} onChange={(event) => setPlayerScore(event.target.value)} type="number" min="0" className={`${input} mt-2`} /></label><label className="text-xs text-[#b7c2d3]">Adversário<input required value={opponentScore} onChange={(event) => setOpponentScore(event.target.value)} type="number" min="0" className={`${input} mt-2`} /></label><label className="text-xs text-[#b7c2d3]">ADR<input required value={adr} onChange={(event) => setAdr(event.target.value)} type="number" min="0" step="0.1" className={`${input} mt-2`} /></label></div><label className="block text-xs text-[#b7c2d3]">KAST (opcional)<input value={kast} onChange={(event) => setKast(event.target.value)} type="number" min="0" max="100" step="0.1" className={`${input} mt-2`} /></label><button type="button" onClick={confirm} className="inline-flex items-center justify-center rounded-xl bg-[#1d6cff] px-4 py-3 text-sm font-semibold">Confirmar e salvar partida</button></div>}</section>
}

export default DemoImportForm
