export type ImportedSideStats = { kills: number; deaths: number; assists: number; headshots: number; adr: number | null; kd: number; hsPercentage: number }
export type ImportedStats = { kills: number | null; deaths: number | null; assists: number | null; headshots: number | null; kd: number | null; hsPercentage: number | null; adr: number | null; kast: number | null; ct: ImportedSideStats; tr: ImportedSideStats }
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
type SideRaw = { kills: number; deaths: number; assists: number; headshots: number; damage: number; rounds: number }
function sideMetrics(raw: SideRaw): ImportedSideStats { return { kills: raw.kills, deaths: raw.deaths, assists: raw.assists, headshots: raw.headshots, adr: raw.rounds > 0 ? raw.damage / raw.rounds : null, kd: raw.deaths > 0 ? raw.kills / raw.deaths : raw.kills, hsPercentage: raw.kills > 0 ? raw.headshots / raw.kills * 100 : 0 } }
function metrics(raw: { kills: number; deaths: number; assists: number; headshots: number }, sides?: { ct: SideRaw; tr: SideRaw }): ImportedStats { const ct = sides?.ct ?? { kills: 0, deaths: 0, assists: 0, headshots: 0, damage: 0, rounds: 0 }; const tr = sides?.tr ?? { kills: 0, deaths: 0, assists: 0, headshots: 0, damage: 0, rounds: 0 }; return { ...raw, kd: raw.deaths > 0 ? raw.kills / raw.deaths : raw.kills, hsPercentage: raw.kills > 0 ? raw.headshots / raw.kills * 100 : 0, adr: null, kast: null, ct: sideMetrics(ct), tr: sideMetrics(tr) } }

export async function parseDemo(buffer: Buffer): Promise<ImportedMatch> {
  const { parseEvent, parseHeader, parsePlayerInfo, parseTicks } = await import('@laihoe/demoparser2')
  const sideFromTeamNum = (teamNum: unknown): 'CT' | 'TR' | null => { const value = Number(teamNum); return value === 3 ? 'CT' : value === 2 ? 'TR' : null }
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
  const deaths = rows(parseEvent(buffer, 'player_death', ['name', 'player_name', 'steamid', 'xuid', 'user_steamid', 'user_xuid', 'userid', 'attacker', 'assister', 'attacker_steamid', 'attacker_xuid', 'attacker_team_name', 'assister_steamid', 'assister_xuid', 'assister_team_name', 'user_team_name', 'headshot'], ['tick', 'user_steamid', 'user_xuid', 'userid', 'attacker', 'attacker_steamid', 'attacker_xuid', 'assister', 'assister_steamid', 'assister_xuid', 'headshot']))
  const ticks = deaths.map((event) => Number(field(event, 'tick'))).filter(Number.isFinite)
  const tickRows = rows(parseTicks(buffer, ['steamid', 'team_num'], ticks))
  const sideAtTick = new Map<string, 'CT' | 'TR'>()
  for (const row of tickRows) { const tick = Number(field(row, 'tick')); const steamId = resolvePlayer(field(row, 'steamid', 'steamId', 'xuid')); const side = sideFromTeamNum(field(row, 'team_num', 'teamNum')); if (Number.isFinite(tick) && steamId && side) sideAtTick.set(`${tick}:${steamId}`, side) }
  const sideFromTeamName = (value: unknown): 'CT' | 'TR' | null => { const team = text(value).toUpperCase(); if (team.includes('CT') || team.includes('COUNTER')) return 'CT'; if (team === 'T' || team.includes('TERRORIST')) return 'TR'; return null }
  const sideFor = (event: Record<string, unknown>, steamId: string, role: 'attacker' | 'victim' | 'assister') => { const direct = sideFromTeamName(role === 'attacker' ? field(event, 'attacker_team_name') : role === 'victim' ? field(event, 'user_team_name', 'victim_team_name') : field(event, 'assister_team_name')); if (direct) return direct; const tick = Number(field(event, 'tick')); if (!Number.isFinite(tick) || !steamId) return null; return sideAtTick.get(`${tick}:${steamId}`) ?? null }
  const playerNames = new Map(rawPlayers.map((player) => [player.steamId, player.name]))
  const sideMap = new Map<string, { ct: SideRaw; tr: SideRaw }>()
  const createSideRaw = (): SideRaw => ({ kills: 0, deaths: 0, assists: 0, headshots: 0, damage: 0, rounds: 0 })
  for (const player of rawPlayers) sideMap.set(player.steamId, { ct: createSideRaw(), tr: createSideRaw() })
  const unresolvedSides = new Set<string>()
  const sideStat = (id: string, side: 'CT' | 'TR' | null) => { if (!id || !side) { if (id) unresolvedSides.add(id); return null }; const entry = sideMap.get(id) ?? { ct: createSideRaw(), tr: createSideRaw() }; sideMap.set(id, entry); return entry[side.toLowerCase() as 'ct' | 'tr'] }
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
    if (statMap.has(attacker)) { const stat = statMap.get(attacker)!; stat.kills += 1; const side = sideStat(attacker, sideFor(event, attacker, 'attacker')); if (side) { side.kills += 1; if (isHeadshot(field(event, 'headshot', 'is_headshot'))) side.headshots += 1 } }
    if (statMap.has(victim)) { statMap.get(victim)!.deaths += 1; const side = sideStat(victim, sideFor(event, victim, 'victim')); if (side) side.deaths += 1 }
    if (statMap.has(assister)) { statMap.get(assister)!.assists += 1; const side = sideStat(assister, sideFor(event, assister, 'assister')); if (side) side.assists += 1 }
  }
  const players = [...statMap.entries()].map(([steamId, raw]) => ({ steamId, name: playerNames.get(steamId) || 'Jogador', team: rawPlayers.find((player) => player.steamId === steamId)?.team ?? null, stats: metrics(raw, sideMap.get(steamId)) }))
  if (!players.length) warnings.push('Não foi possível identificar jogadores nesta demo.')
  if (!deaths.length) warnings.push('A demo não expôs eventos de eliminação suficientes para calcular estatísticas automaticamente.')
  const totals = [...sideMap.values()].reduce((sum, sides) => ({ kills: sum.kills + sides.ct.kills + sides.tr.kills, deaths: sum.deaths + sides.ct.deaths + sides.tr.deaths, assists: sum.assists + sides.ct.assists + sides.tr.assists, headshots: sum.headshots + sides.ct.headshots + sides.tr.headshots }), { kills: 0, deaths: 0, assists: 0, headshots: 0 })
  const general = [...statMap.values()].reduce((sum, stat) => ({ kills: sum.kills + stat.kills, deaths: sum.deaths + stat.deaths, assists: sum.assists + stat.assists, headshots: sum.headshots + stat.headshots }), { kills: 0, deaths: 0, assists: 0, headshots: 0 })
  if (general.kills !== totals.kills || general.deaths !== totals.deaths || general.assists !== totals.assists || general.headshots !== totals.headshots) warnings.push(`Não foi possível classificar todos os eventos por lado: geral K/D/A/HS ${general.kills}/${general.deaths}/${general.assists}/${general.headshots}; lados ${totals.kills}/${totals.deaths}/${totals.assists}/${totals.headshots}.`)
  if (process.env.NODE_ENV !== 'production') console.log('[demo-parser] jogadores:', statMap.size, 'player_death:', deaths.length, 'vítimas resolvidas:', resolvedVictims, 'eventos sem side resolvido:', unresolvedSides.size, 'CT:', [...sideMap.values()].reduce((sum, sides) => sum + sides.ct.kills, 0), 'TR:', [...sideMap.values()].reduce((sum, sides) => sum + sides.tr.kills, 0))
  warnings.push(`player_death: ${deaths.length} eventos, ${resolvedVictims} vítimas resolvidas, ${unresolvedVictims} não resolvidas, ${general.deaths} deaths contabilizadas.`)
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
