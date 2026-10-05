export type ImportedStats = { kills: number | null; deaths: number | null; assists: number | null; headshots: number | null; kd: number | null; hsPercentage: number | null; adr: number | null; kast: number | null }
export type ImportedPlayer = { steamId: string; name: string; team: string | null; stats: ImportedStats }
export type ImportedMatch = { map: string | null; playedAt: string | null; players: ImportedPlayer[]; stats: ImportedStats; source: 'demo'; warnings: string[] }

function rows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const list = Object.values(object).find(Array.isArray)
    if (Array.isArray(list)) return list.map((_, index) => Object.fromEntries(Object.entries(object).map(([key, entry]) => [key, Array.isArray(entry) ? entry[index] : entry])))
  }
  return []
}
function asNumber(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : null }
function text(value: unknown) { return value == null ? '' : String(value) }
function isHeadshot(value: unknown) { return value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' }
function metrics(raw: { kills: number; deaths: number; assists: number; headshots: number }): ImportedStats { return { ...raw, kd: raw.deaths > 0 ? raw.kills / raw.deaths : raw.kills, hsPercentage: raw.kills > 0 ? raw.headshots / raw.kills * 100 : 0, adr: null, kast: null } }

export async function parseDemo(buffer: Buffer): Promise<ImportedMatch> {
  const { parseEvent, parseHeader, parsePlayerInfo } = await import('@laihoe/demoparser2')
  const warnings: string[] = []
  const header = parseHeader(buffer) as Record<string, unknown>
  const info = rows(parsePlayerInfo(buffer))
  const rawPlayers = Array.from(new Map(info.map((player) => { const steamId = text(player.steamid ?? player.steamId ?? player.xuid ?? player.name); return [steamId, { steamId, name: text(player.name ?? player.player_name ?? steamId) || 'Jogador', team: player.team == null ? null : text(player.team) }] })).values())
  const statMap = new Map<string, { kills: number; deaths: number; assists: number; headshots: number }>(rawPlayers.map((player) => [player.steamId, { kills: 0, deaths: 0, assists: 0, headshots: 0 }]))
  const deaths = rows(parseEvent(buffer, 'player_death', ['name', 'steamid', 'assister_steamid', 'assister_name', 'headshot'], ['attacker_steamid', 'attacker_name']))
  const seen = new Set<string>()
  for (const [index, event] of deaths.entries()) {
    const attacker = text(event.attacker_steamid); const victim = text(event.steamid); const assister = text(event.assister_steamid)
    const key = `${index}:${attacker}:${victim}:${text(event.assister_steamid)}:${text(event.headshot)}`
    if (seen.has(key)) continue
    seen.add(key)
    if (statMap.has(attacker)) { const stat = statMap.get(attacker)!; stat.kills += 1; if (isHeadshot(event.headshot)) stat.headshots += 1 }
    if (statMap.has(victim)) statMap.get(victim)!.deaths += 1
    if (statMap.has(assister)) statMap.get(assister)!.assists += 1
  }
  const players = rawPlayers.map((player) => ({ ...player, stats: metrics(statMap.get(player.steamId) ?? { kills: 0, deaths: 0, assists: 0, headshots: 0 }) }))
  if (!players.length) warnings.push('Não foi possível identificar jogadores nesta demo.')
  if (!deaths.length) warnings.push('A demo não expôs eventos de eliminação suficientes para calcular estatísticas automaticamente.')
  const empty = metrics({ kills: 0, deaths: 0, assists: 0, headshots: 0 })
  return { map: typeof header.map_name === 'string' ? header.map_name : typeof header.map === 'string' ? header.map : null, playedAt: null, players, stats: empty, source: 'demo', warnings }
}

export function calculateImportedMetrics(stats: ImportedStats) { return { kd: stats.deaths == null ? null : stats.deaths > 0 ? (stats.kills ?? 0) / stats.deaths : stats.kills ?? 0, hsPercent: stats.kills == null || stats.kills === 0 ? 0 : (stats.headshots ?? 0) / stats.kills * 100 } }

export type { ImportedStats as DemoStats }
export type { ImportedPlayer as DemoPlayer }
export type { ImportedMatch as DemoMatch }
export type { ImportedPlayer as AnalyticsPlayer }
export type { ImportedMatch as AnalyticsMatch }
export type { ImportedStats as AnalyticsStats }
export type { ImportedPlayer as MatchPlayer }
export type { ImportedMatch as ParsedMatch }
export type { ImportedStats as ParsedStats }
export type { ImportedPlayer as PlayerStats }
export type { ImportedMatch as ParsedDemo }
