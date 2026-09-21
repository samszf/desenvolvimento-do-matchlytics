export type MatchLike = {
  result: string
  playerScore: number
  opponentScore: number
  mapName?: string
  playedAt: Date | string
  kills?: number | null
  deaths?: number | null
  headshots?: number | null
  adr?: number | string | null
  kast?: number | string | null
}

const n = (value: number | string | null | undefined) => value == null ? null : Number(value)
export const ratio = (kills: number | null | undefined, deaths: number | null | undefined) => {
  if (kills == null || deaths == null) return null
  return deaths === 0 ? (kills > 0 ? kills : 0) : kills / deaths
}
export const percentage = (value: number | null | undefined, total: number | null | undefined) => value == null || total == null || total === 0 ? null : (value / total) * 100
export const performanceScore = (match: MatchLike) => {
  const kills = n(match.kills) ?? 0, deaths = n(match.deaths) ?? 0, adr = n(match.adr) ?? 0
  const combat = Math.min(100, kills * 2.5 + adr * 0.25)
  const survival = deaths === 0 ? 100 : Math.max(0, 100 - deaths * 3)
  const objective = match.result === 'win' ? 100 : match.result === 'draw' ? 50 : 0
  const consistency = Math.min(100, (n(match.kast) ?? 50))
  const contribution = match.result === 'win' ? 100 : match.result === 'draw' ? 50 : 20
  return Math.round(Math.max(0, Math.min(100, combat * .3 + survival * .15 + objective * .2 + consistency * .15 + contribution * .2)))
}
export const summarize = (matches: MatchLike[]) => {
  const total = matches.length
  const wins = matches.filter(m => m.result === 'win').length
  const kills = matches.reduce((sum, m) => sum + (n(m.kills) ?? 0), 0)
  const deaths = matches.reduce((sum, m) => sum + (n(m.deaths) ?? 0), 0)
  const adrs = matches.map(m => n(m.adr)).filter((v): v is number => v != null)
  return { total, wins, winRate: total ? wins / total * 100 : null, kd: ratio(kills, deaths), adr: adrs.length ? adrs.reduce((a, b) => a + b, 0) / adrs.length : null, score: total ? matches.reduce((s, m) => s + performanceScore(m), 0) / total : null }
}
export const formatMetric = (value: number | string | null | undefined, suffix = '') => {
  if (value == null || value === '') return '—'
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(1)}${suffix}` : '—'
}

export type { MatchLike as AnalyticsMatch }

// Performance Score experimental do Matchlytics; não é uma estatística oficial do CS2.
export const buildInsights = (matches: MatchLike[]) => {
  if (matches.length < 2) return []
  const recent = matches.slice(-Math.min(5, matches.length)), previous = matches.slice(0, -recent.length)
  const a = summarize(recent), b = summarize(previous)
  const insights: string[] = []
  if (a.kd != null && b.kd != null && a.kd > b.kd * 1.1) insights.push(`Seu K/D aumentou nos últimos ${recent.length} jogos.`)
  if (a.adr != null && b.adr != null && a.adr < b.adr * .9) insights.push(`Seu ADR apresentou queda nas últimas ${recent.length} partidas.`)
  if (a.winRate != null && b.winRate != null && a.winRate > b.winRate + 10) insights.push(`Seu Win Rate aumentou nas últimas ${recent.length} partidas.`)
  const maps = new Map<string, MatchLike[]>()
  matches.forEach(m => { if (m.mapName) maps.set(m.mapName, [...(maps.get(m.mapName) ?? []), m]) })
  const best = [...maps.entries()].filter(([, ms]) => ms.length >= 2).sort((x, y) => (summarize(y[1]).kd ?? 0) - (summarize(x[1]).kd ?? 0))[0]
  if (best) insights.push(`${best[0]} apresenta seu maior K/D médio (${best[1].length} partidas).`)
  return insights
}
