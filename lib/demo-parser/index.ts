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
function asNumber(value: unknown) { const numeric = Number(value); return Number.isFinite(numeric) ? numeric : null }
function text(value: unknown) { return value == null ? '' : String(value) }
function field(row: Record<string, unknown>, ...keys: string[]) { for (const key of keys) if (row[key] != null) return row[key]; return null }
function playerKey(row: Record<string, unknown>) { return text(field(row, 'steamid', 'steamId', 'steam_id', 'steamid64', 'steamId64', 'xuid', 'xuid64')) }
function isHeadshot(value: unknown) { return value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' }
function metrics(raw: { kills: number; deaths: number; assists: number; headshots: number }): ImportedStats { return { ...raw, kd: raw.deaths > 0 ? raw.kills / raw.deaths : raw.kills, hsPercentage: raw.kills > 0 ? raw.headshots / raw.kills * 100 : 0, adr: null, kast: null } }

export async function parseDemo(buffer: Buffer): Promise<ImportedMatch> {
  const { parseEvent, parseHeader, parsePlayerInfo } = await import('@laihoe/demoparser2')
  const warnings: string[] = []
  const header = parseHeader(buffer) as Record<string, unknown>
  const info = rows(parsePlayerInfo(buffer))
  const rawPlayers = Array.from(new Map(info.map((player) => { const steamId = playerKey(player); return [steamId, { steamId, name: text(field(player, 'name', 'player_name', 'playerName')) || 'Jogador', team: field(player, 'team', 'team_num', 'teamNumber') == null ? null : text(field(player, 'team', 'team_num', 'teamNumber')) }] })).values()).filter((player) => player.steamId)
  const statMap = new Map<string, { kills: number; deaths: number; assists: number; headshots: number }>(rawPlayers.map((player) => [player.steamId, { kills: 0, deaths: 0, assists: 0, headshots: 0 }]))
  const aliases = new Map<string, string>()
  for (const player of info) {
    const canonical = playerKey(player)
    if (!canonical) continue
    for (const key of ['steamid', 'steamId', 'steam_id', 'steamid64', 'steamId64', 'xuid', 'accountid', 'userid', 'user_id', 'entityid', 'entityId']) {
      const value = text(player[key])
      if (value) aliases.set(value, canonical)
    }
    for (const key of ['name', 'player_name', 'playerName']) {
      const value = text(player[key])
      if (value) aliases.set(value, canonical)
    }
  }
  const resolvePlayer = (value: unknown) => { const candidate = text(value); return aliases.get(candidate) ?? (statMap.has(candidate) ? candidate : '') }
  const deaths = rows(parseEvent(buffer, 'player_death', ['name', 'player_name', 'steamid', 'xuid', 'user_steamid', 'user_xuid', 'userid', 'attacker', 'assister', 'attacker_steamid', 'attacker_xuid', 'assister_steamid', 'assister_xuid', 'headshot'], ['user_steamid', 'user_xuid', 'userid', 'attacker', 'attacker_steamid', 'attacker_xuid', 'assister', 'assister_steamid', 'assister_xuid', 'headshot']))
  const playerNames = new Map(rawPlayers.map((player) => [player.steamId, player.name]))
  const ensurePlayer = (id: string, name?: unknown) => {
    if (!id) return
    if (!statMap.has(id)) statMap.set(id, { kills: 0, deaths: 0, assists: 0, headshots: 0 })
    if (!playerNames.has(id) && name != null) playerNames.set(id, text(name))
  }
  const seen = new Set<string>()
  let resolvedVictims = 0
  let unresolvedVictims = 0
  for (const [index, event] of deaths.entries()) {
    const attacker = resolvePlayer(field(event, 'attacker_steamid', 'attackerSteamId', 'attacker_xuid', 'attacker'))
    const victim = resolvePlayer(field(event, 'user_steamid', 'user_xuid', 'victim_steamid', 'victim_xuid', 'steamid', 'steamId', 'xuid', 'name', 'victim_name', 'userid', 'victim'))
    const assister = resolvePlayer(field(event, 'assister_steamid', 'assisterSteamId', 'assister_xuid', 'assister'))
    const key = `${index}:${attacker}:${victim}:${assister}:${text(field(event, 'headshot', 'is_headshot'))}`
    if (seen.has(key)) continue
    seen.add(key)
    if (victim) resolvedVictims += 1
    else { unresolvedVictims += 1; if (process.env.NODE_ENV !== 'production') console.warn('[player_death] vítima não resolvida', event) }
    ensurePlayer(attacker, field(event, 'attacker_name', 'attackerName'))
    ensurePlayer(victim, field(event, 'name', 'player_name', 'victim_name', 'victimName'))
    ensurePlayer(assister, field(event, 'assister_name', 'assisterName'))
    if (statMap.has(attacker)) { const stat = statMap.get(attacker)!; stat.kills += 1; if (isHeadshot(field(event, 'headshot', 'is_headshot'))) stat.headshots += 1 }
    if (statMap.has(victim)) statMap.get(victim)!.deaths += 1
    if (statMap.has(assister)) statMap.get(assister)!.assists += 1
  }
  const players = [...statMap.entries()].map(([steamId, raw]) => ({ steamId, name: playerNames.get(steamId) || 'Jogador', team: rawPlayers.find((player) => player.steamId === steamId)?.team ?? null, stats: metrics(raw) }))
  if (!players.length) warnings.push('Não foi possível identificar jogadores nesta demo.')
  if (!deaths.length) warnings.push('A demo não expôs eventos de eliminação suficientes para calcular estatísticas automaticamente.')
  warnings.push(`player_death: ${deaths.length} eventos, ${resolvedVictims} vítimas resolvidas, ${unresolvedVictims} não resolvidas, ${[...statMap.values()].reduce((sum, stat) => sum + stat.deaths, 0)} deaths contabilizadas.`)
  const empty = metrics({ kills: 0, deaths: 0, assists: 0, headshots: 0 })
  const selected = players.reduce((best, player) => (player.stats.kills ?? 0) > (best?.stats.kills ?? -1) ? player : best, players[0])
  return { map: typeof header.map_name === 'string' ? header.map_name : typeof header.map === 'string' ? header.map : null, playedAt: null, players, stats: selected?.stats ?? empty, source: 'demo', warnings }
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
