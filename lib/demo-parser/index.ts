import { parseEvent, parseHeader, parsePlayerInfo } from '@laihoe/demoparser2'

export type ImportedPlayer = { steamId: string; name: string }
export type ImportedMatch = {
  map: string | null
  playedAt: string | null
  players: ImportedPlayer[]
  stats: Record<string, number | null>
  source: 'demo'
  warnings: string[]
}

function rows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const length = Object.values(object).find((entry) => Array.isArray(entry))
    if (Array.isArray(length)) return length.map((_, index) => Object.fromEntries(Object.entries(object).map(([key, entry]) => [key, Array.isArray(entry) ? entry[index] : entry])))
  }
  return []
}

function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : null }
function playerName(player: Record<string, unknown>) { return String(player.name ?? player.player_name ?? player.steamid ?? player.steamId ?? 'Jogador') }

export function parseDemo(buffer: Buffer): ImportedMatch {
  const warnings: string[] = []
  const header = parseHeader(buffer) as Record<string, unknown>
  const info = rows(parsePlayerInfo(buffer))
  const players = Array.from(new Map(info.map((player) => {
    const steamId = String(player.steamid ?? player.steamId ?? player.xuid ?? playerName(player))
    return [steamId, { steamId, name: playerName(player) }]
  })).values())
  if (!players.length) warnings.push('Não foi possível identificar jogadores nesta demo.')

  const deaths = rows(parseEvent(buffer, 'player_death', ['name', 'steamid', 'assister_steamid', 'assister_name', 'headshot'], ['attacker_steamid', 'attacker_name']))
  const stats = new Map<string, { kills: number; deaths: number; assists: number; headshots: number }>()
  for (const player of players) stats.set(player.steamId, { kills: 0, deaths: 0, assists: 0, headshots: 0 })
  for (const event of deaths) {
    const attacker = String(event.attacker_steamid ?? '')
    const victim = String(event.steamid ?? '')
    const assister = String(event.assister_steamid ?? '')
    if (stats.has(attacker)) stats.get(attacker)!.kills += 1
    if (stats.has(victim)) stats.get(victim)!.deaths += 1
    if (stats.has(assister)) stats.get(assister)!.assists += 1
    if (stats.has(attacker) && Boolean(event.headshot)) stats.get(attacker)!.headshots += 1
  }
  if (!deaths.length) warnings.push('A demo não expôs eventos de eliminação suficientes para calcular estatísticas automaticamente.')
  const first = players[0] ? stats.get(players[0].steamId) : null
  return {
    map: typeof header.map_name === 'string' ? header.map_name : typeof header.map === 'string' ? header.map : null,
    playedAt: null,
    players,
    stats: first ? { kills: first.kills, deaths: first.deaths, assists: first.assists, headshots: first.headshots, adr: null, kast: null } : { kills: null, deaths: null, assists: null, headshots: null, adr: null, kast: null },
    source: 'demo', warnings,
  }
}

export function calculateImportedMetrics(stats: Record<string, number | null>) {
  const kills = stats.kills ?? 0; const deaths = stats.deaths ?? 0
  return { kd: deaths ? kills / deaths : null, hsPercent: kills ? ((stats.headshots ?? 0) / kills) * 100 : null }
}
