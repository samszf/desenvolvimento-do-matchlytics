import type { ImportedMatch, ImportedPlayer, ImportedStats } from './index'

type WasmModule = {
  default: (input?: RequestInfo | URL | BufferSource) => Promise<unknown>
  parseHeader: (file: Uint8Array) => Record<string, unknown>
  parseEvent: (file: Uint8Array, event: string, players?: string[], other?: string[]) => unknown
}

let modulePromise: Promise<WasmModule> | null = null

async function loadParser() {
  modulePromise ??= import('demoparser2/demoparser2.js').then(async (module) => {
    const wasm = module as unknown as WasmModule
    await wasm.default('/demoparser2_bg.wasm')
    return wasm
  })
  return modulePromise
}

const numberValue = (value: unknown) => { const result = Number(value); return Number.isFinite(result) ? result : null }
const textValue = (value: unknown) => value == null ? '' : String(value)
const rows = (value: unknown) => Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object') : []

function stats(raw: { kills: number; deaths: number; assists: number; headshots: number }): ImportedStats {
  const kd = raw.deaths ? raw.kills / raw.deaths : raw.kills ? raw.kills : null
  return { ...raw, kd, hsPercentage: raw.kills ? raw.headshots / raw.kills * 100 : null, adr: null, kast: null }
}

export async function parseDemoInBrowser(file: File): Promise<ImportedMatch> {
  const parser = await loadParser()
  const bytes = new Uint8Array(await file.arrayBuffer())
  const header = parser.parseHeader(bytes)
  const players = new Map<string, ImportedPlayer & { raw: { kills: number; deaths: number; assists: number; headshots: number } }>()
  const ensure = (id: unknown, name?: unknown) => {
    const steamId = textValue(id)
    if (!steamId) return
    const existing = players.get(steamId)
    if (existing) { if (existing.name === 'Jogador' && name) existing.name = textValue(name); return }
    players.set(steamId, { steamId, name: textValue(name) || 'Jogador', team: null, stats: stats({ kills: 0, deaths: 0, assists: 0, headshots: 0 }), raw: { kills: 0, deaths: 0, assists: 0, headshots: 0 } })
  }
  const events = rows(parser.parseEvent(bytes, 'player_death', ['name', 'steamid', 'xuid', 'assister_steamid', 'assister_xuid', 'headshot'], ['attacker_steamid', 'attacker_xuid', 'attacker_name', 'victim_steamid']))
  for (const event of events) {
    const attacker = event.attacker_steamid ?? event.attacker_xuid
    const victim = event.steamid ?? event.xuid ?? event.victim_steamid
    const assister = event.assister_steamid ?? event.assister_xuid
    ensure(attacker, event.attacker_name); ensure(victim, event.name); ensure(assister, event.assister_name)
    const attackerPlayer = players.get(textValue(attacker)); const victimPlayer = players.get(textValue(victim)); const assisterPlayer = players.get(textValue(assister))
    if (attackerPlayer && textValue(attacker) !== textValue(victim)) { attackerPlayer.raw.kills += 1; if (event.headshot === true || event.headshot === 1) attackerPlayer.raw.headshots += 1 }
    if (victimPlayer) victimPlayer.raw.deaths += 1
    if (assisterPlayer) assisterPlayer.raw.assists += 1
  }
  const result = [...players.values()].map(({ raw, ...player }) => ({ ...player, stats: stats(raw) }))
  return { map: textValue(header.map_name ?? header.map) || null, playedAt: null, players: result, stats: result[0]?.stats ?? stats({ kills: 0, deaths: 0, assists: 0, headshots: 0 }), source: 'demo', warnings: result.length ? [] : ['Nenhum jogador foi encontrado nos eventos da demo.'] }
}
