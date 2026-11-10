'use client'

import { useRef, useState } from 'react'
import { useSession } from '@/lib/auth-client'
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
  const sideCards = (label: string, side: ImportedStats['ct']) => <div className="rounded-xl border border-white/8 bg-[#0c1118] p-4"><p className="mb-3 text-sm font-semibold text-white">{label}</p><div className="grid grid-cols-2 gap-3 text-sm"><span>Kills <b>{side.kills}</b></span><span>Deaths <b>{side.deaths}</b></span><span>Assists <b>{side.assists}</b></span><span>Headshots <b>{side.headshots}</b></span><span>K/D <b>{side.kd.toFixed(2)}</b></span><span>HS% <b>{side.hsPercentage.toFixed(1)}%</b></span></div></div>
  return <div className="space-y-3"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{values.map(([label, value]) => <div key={label} className="rounded-xl border border-white/8 bg-[#0c1118] p-4"><p className="text-xs text-[#8995a5]">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>)}</div><div className="grid gap-3 sm:grid-cols-2">{sideCards('CT', stats.ct)}{sideCards('TR', stats.tr)}</div></div>
}

function PlayerRow({ item, selected, onSelect }: { item: ImportedPlayer; selected: boolean; onSelect: () => void }) {
  const stats = item.stats
  const team = item.team ?? 'Time não identificado'
  const hs = stats.hsPercentage == null ? 'Indisponível' : `${stats.hsPercentage.toFixed(1)}%`
  return <button type="button" role="radio" aria-checked={selected} aria-label={`${item.name}, ${team}. Kills ${format(stats.kills)}, Deaths ${format(stats.deaths)}, Assists ${format(stats.assists)}, Headshots ${format(stats.headshots)}, K/D ${format(stats.kd, 2)}, HS% ${hs}. ${selected ? 'Jogador selecionado.' : 'Selecionar jogador.'}`} onClick={onSelect} className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bb8ff] ${selected ? 'border-[#4c8dff] bg-[#13294f]' : 'border-white/8 bg-[#0c1118] hover:border-white/20'}`}><div className="grid grid-cols-1 gap-3 sm:grid-cols-8 sm:items-center"><span className="min-w-0 font-medium text-white sm:col-span-2">{item.name}</span><span className="text-xs text-[#94a0b1]">{team}</span><span className="hidden text-center text-sm sm:block">{format(stats.kills)}</span><span className="hidden text-center text-sm sm:block">{format(stats.deaths)}</span><span className="hidden text-center text-sm sm:block">{format(stats.assists)}</span><span className="hidden text-center text-sm sm:block">{format(stats.headshots)}</span><span className="hidden text-center text-sm sm:block">{format(stats.kd, 2)}</span><span className="hidden text-right text-sm font-semibold text-[#9bc0ff] sm:block">{hs}</span></div><div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-sm sm:hidden"><span>Kills: <strong>{format(stats.kills)}</strong></span><span>Deaths: <strong>{format(stats.deaths)}</strong></span><span>Assists: <strong>{format(stats.assists)}</strong></span><span>Headshots: <strong>{format(stats.headshots)}</strong></span><span>K/D: <strong>{format(stats.kd, 2)}</strong></span><span>HS%: <strong>{hs}</strong></span></div>{selected && <span className="mt-3 inline-flex rounded-full bg-[#1965f5] px-2.5 py-1 text-xs font-semibold text-white">Jogador selecionado</span>}</button>
}

export function DemoImportForm() {
  const { data: session } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ImportedMatch | null>(null)
  const [player, setPlayer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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
      if (!session?.user.id) throw new Error('Não autenticado')
      const blob = await upload(`demos/${session.user.id}/${file.name}`, file, { access: 'private', contentType: 'application/octet-stream', handleUploadUrl: '/api/matches/import/upload' })
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
    if (!data || !selectedPlayer || !selectedStats) { setError('Selecione um jogador para continuar.'); return }
    if ([selectedStats.kills, selectedStats.deaths, selectedStats.assists, selectedStats.headshots].some((value) => value == null)) { setError('Revise os dados: a demo não forneceu estatísticas suficientes.'); return }
    const numericPlayerScore = Number(playerScore)
    const numericOpponentScore = Number(opponentScore)
    const numericAdr = Number(adr)
    const numericKast = kast ? Number(kast) : undefined
    if (![numericPlayerScore, numericOpponentScore, numericAdr, numericKast].filter((value): value is number => value !== undefined).every(Number.isFinite)) { setError('Confira os dados informados. Preencha placares, ADR e KAST com valores numéricos.'); return }
    const sideStats = { ctKills: selectedStats.ct.kills, ctDeaths: selectedStats.ct.deaths, ctAssists: selectedStats.ct.assists, ctHeadshots: selectedStats.ct.headshots, ctAdr: selectedStats.ct.adr, trKills: selectedStats.tr.kills, trDeaths: selectedStats.tr.deaths, trAssists: selectedStats.tr.assists, trHeadshots: selectedStats.tr.headshots, trAdr: selectedStats.tr.adr }
    setSaving(true)
    try {
      const response = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ map: data.map ?? 'Desconhecido', playedAt: data.playedAt ?? new Date().toISOString(), result, playerScore: numericPlayerScore, opponentScore: numericOpponentScore, kills: selectedStats.kills, deaths: selectedStats.deaths, assists: selectedStats.assists, headshots: selectedStats.headshots, adr: numericAdr, kast: numericKast, ...sideStats }) })
      if (!response.ok) { setError((await response.json()).error ?? 'Não foi possível importar a partida.'); return }
      window.location.href = '/matches'
    } finally { setSaving(false) }
  }

  return <section aria-busy={loading || saving} aria-labelledby="import-title" aria-describedby={error ? 'import-error' : undefined} className="mt-8 rounded-2xl border border-white/10 bg-[#111720] p-5 sm:p-7"><div aria-live="polite" className="sr-only">{loading ? 'Enviando e analisando sua demo, aguarde.' : saving ? 'Salvando partida, aguarde.' : data ? 'Partida analisada com sucesso. Selecione seu jogador para continuar.' : file ? `Arquivo selecionado: ${file.name}.` : ''}</div><div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); choose(event.dataTransfer.files[0]) }} className="rounded-2xl border border-dashed border-[#4c8dff]/50 bg-[#0c1118] p-10 text-center"><UploadCloud aria-hidden="true" className="mx-auto size-10 text-[#6ea5ff]" /><h2 id="import-title" className="mt-4 text-xl font-semibold">Arraste sua demo do CS2 aqui</h2><p className="mt-2 text-sm text-[#8995a5]">ou selecione um arquivo .dem de até 300 MB</p><label htmlFor="demo-file" className="sr-only">Arquivo de demo do Counter-Strike 2, formato .dem, até 300 MB</label><input id="demo-file" ref={inputRef} className="sr-only" type="file" accept=".dem,application/octet-stream" onChange={(event) => choose(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1965f5] px-4 py-3 text-sm font-semibold"><FileUp className="size-4" /> Selecionar arquivo</button>{file && <p className="mt-4 text-sm text-[#b7c2d3]">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}</div>{file && !data && <button type="button" disabled={loading} onClick={analyze} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold disabled:opacity-60">{loading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} {loading ? 'Analisando sua partida...' : 'Analisar demo'}</button>}{error && <p id="import-error" role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{data && <div className="mt-7 flex flex-col gap-6"><div className="flex items-center gap-2 text-[#68d391]"><CheckCircle2 className="size-5" /> Partida analisada com sucesso.</div><div><label className="text-sm font-semibold" htmlFor="demo-player">Quem é você nesta partida?</label><select id="demo-player" required aria-invalid={!player} aria-describedby="player-help" value={player} onChange={(event) => setPlayer(event.target.value)} className={`${input} mt-2`}><option value="" disabled>Selecione um jogador</option>{data.players.map((item) => <option key={item.steamId} value={item.steamId}>{item.name} · {item.team ?? 'Time não identificado'}</option>)}</select><span id="player-help" className="sr-only">Selecione o jogador que deseja analisar e salvar.</span></div><div><h3 className="text-lg font-semibold">Jogadores encontrados</h3><div className="mt-3 hidden grid-cols-8 gap-3 px-4 text-xs uppercase tracking-wider text-[#8995a5] sm:grid"><span className="col-span-2">Jogador</span><span>Time</span><span className="text-center">K</span><span className="text-center">D</span><span className="text-center">A</span><span className="text-center">HS</span><span className="text-right">K/D</span></div><div className="mt-2 space-y-2" role="radiogroup" aria-label="Jogadores encontrados" aria-describedby="players-count">{data.players.map((item) => <PlayerRow key={item.steamId} item={item} selected={item.steamId === player} onSelect={() => setPlayer(item.steamId)} />)}</div><p id="players-count" className="sr-only">{data.players.length} jogadores encontrados. Cada jogador inclui time, Kills, Deaths, Assists, Headshots, K/D e HS%.</p></div>{selectedPlayer && selectedStats && <div className="rounded-2xl border border-[#4c8dff]/30 bg-[#10234a] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#9bc0ff]">Seu desempenho importado</p><div className="mt-2 flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-xl font-semibold text-white">{selectedPlayer.name}</h3><span className="text-sm text-[#b7c2d3]">Time: {selectedPlayer.team ?? 'não identificado'}</span></div><div className="mt-5"><StatGrid stats={selectedStats} /></div></div>}<div className="grid gap-3 sm:grid-cols-4"><label htmlFor="demo-result" className="text-xs text-[#b7c2d3]">Resultado<select id="demo-result" value={result} onChange={(event) => setResult(event.target.value)} className={`${input} mt-2`}><option value="win">Vitória</option><option value="loss">Derrota</option><option value="draw">Empate</option></select></label><label htmlFor="demo-player-score" className="text-xs text-[#b7c2d3]">Seu placar<input id="demo-player-score" required aria-required="true" aria-invalid={!playerScore || undefined} aria-describedby={!playerScore ? 'demo-save-help' : undefined} value={playerScore} onChange={(event) => setPlayerScore(event.target.value)} type="number" min="0" className={`${input} mt-2`} /></label><label htmlFor="demo-opponent-score" className="text-xs text-[#b7c2d3]">Adversário<input id="demo-opponent-score" required aria-required="true" aria-invalid={!opponentScore || undefined} aria-describedby={!opponentScore ? 'demo-save-help' : undefined} value={opponentScore} onChange={(event) => setOpponentScore(event.target.value)} type="number" min="0" className={`${input} mt-2`} /></label><label htmlFor="demo-adr" className="text-xs text-[#b7c2d3]">ADR<input id="demo-adr" required aria-required="true" aria-invalid={!adr || undefined} aria-describedby={!adr ? 'demo-save-help' : undefined} value={adr} onChange={(event) => setAdr(event.target.value)} type="number" min="0" step="0.1" className={`${input} mt-2`} /></label></div><label htmlFor="demo-kast" className="block text-xs text-[#b7c2d3]">KAST (opcional)<input id="demo-kast" value={kast} onChange={(event) => setKast(event.target.value)} type="number" min="0" max="100" step="0.1" className={`${input} mt-2`} /></label><p id="demo-save-help" className="sr-only">Preencha seu placar, o placar adversário e o ADR para salvar a partida.</p><button type="button" onClick={confirm} disabled={saving || loading} aria-disabled={saving || loading} aria-busy={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1965f5] px-4 py-3 text-sm font-semibold disabled:opacity-60">{saving && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}{saving ? 'Salvando partida...' : 'Confirmar e salvar partida'}</button></div>}</section>
}

export default DemoImportForm
