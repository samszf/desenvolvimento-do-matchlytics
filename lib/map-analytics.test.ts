import { describe, expect, it } from 'vitest'
import { performanceScore } from './analytics'
import { aggregateMapStats, type MapMatch } from './map-analytics'
import { normalizeMapName } from './maps'

const userA = 'user-a'
const userB = 'user-b'
function match(id: string, mapId: string, overrides: Partial<MapMatch> = {}): MapMatch {
  return {
    id, userId: userA, mapId, playedAt: '2026-10-01T12:00:00.000Z', result: 'win',
    playerScore: 13, opponentScore: 8, kills: 20, deaths: 10, assists: 4, headshots: 8,
    adr: 80, kast: 75, ...overrides,
  }
}

describe('normalização canônica de nomes de mapas', () => {
  it.each(['de_mirage', 'Mirage', 'DE_MIRAGE', 'de-mirage', 'DE MIRAGE'])(
    'normaliza %s para a mesma chave e rótulo', (input) => {
      expect(normalizeMapName(input)).toEqual({ key: 'mirage', name: 'Mirage', known: true })
    },
  )

  it.each(['de_dust2', 'Dust 2', 'DE_DUST2', 'dust-2', 'dust_2'])(
    'normaliza %s para Dust 2', (input) => {
      expect(normalizeMapName(input)).toEqual({ key: 'dust2', name: 'Dust 2', known: true })
    },
  )

  it.each(['de_inferno', 'Inferno', 'de_vertigo', 'Vertigo'])(
    'normaliza alias conhecido %s sem fuzzy matching', (input) => {
      const map = normalizeMapName(input)
      expect(map.known).toBe(true)
      expect(map.name).not.toBeNull()
    },
  )

  it('não aproxima mapas desconhecidos de mapas conhecidos', () => {
    expect(normalizeMapName('miragex')).toEqual({ key: 'miragex', name: 'Miragex', known: false })
    expect(normalizeMapName('de_overpass').key).toBe('de-overpass')
    expect(normalizeMapName('')).toEqual({ key: null, name: null, known: false })
  })
})

describe('consolidação de partidas por mapa', () => {
  it('agrupa cadastro manual e demo em um único Mirage', () => {
    const groups = aggregateMapStats([
      match('manual', 'Mirage', { result: 'loss' }),
      match('demo', 'de_mirage', { result: 'win' }),
    ], userA)
    expect(groups).toHaveLength(1)
    expect(groups[0].mapKey).toBe('mirage')
    expect(groups[0].mapName).toBe('Mirage')
    expect(groups[0].total).toBe(2)
  })

  it('mantém dados de usuários diferentes separados', () => {
    const groups = aggregateMapStats([
      match('a', 'de_mirage'),
      match('b', 'Mirage', { userId: userB }),
    ], userA)
    expect(groups).toHaveLength(1)
    expect(groups[0].total).toBe(1)
  })

  it('respeita filtros de período inclusivos', () => {
    const groups = aggregateMapStats([
      match('before', 'Mirage', { playedAt: '2026-09-30T23:59:59.999Z' }),
      match('start', 'de_mirage', { playedAt: '2026-10-01T00:00:00.000Z' }),
      match('end', 'Mirage', { playedAt: '2026-10-31T23:59:59.999Z' }),
      match('after', 'de_mirage', { playedAt: '2026-11-01T00:00:00.000Z' }),
    ], userA, { from: new Date('2026-10-01T00:00:00.000Z'), to: new Date('2026-10-31T23:59:59.999Z') })
    expect(groups[0].total).toBe(2)
  })

  it('recalcula partidas e Win Rate pelos resultados individuais', () => {
    const groups = aggregateMapStats([
      ...Array.from({ length: 10 }, (_, index) => match(`demo-${index}`, 'de_mirage', { result: 'win' })),
      ...Array.from({ length: 2 }, (_, index) => match(`manual-win-${index}`, 'Mirage', { result: 'win' })),
      ...Array.from({ length: 2 }, (_, index) => match(`manual-loss-${index}`, 'Mirage', { result: 'loss' })),
    ], userA)
    expect(groups).toHaveLength(1)
    expect(groups[0].total).toBe(14)
    expect(groups[0].wins).toBe(12)
    expect(groups[0].winRate).toBeCloseTo(85.7142857)
  })

  it('calcula K/D a partir da soma das kills e deaths, não da média de K/D', () => {
    const groups = aggregateMapStats([
      match('high-kd', 'Mirage', { kills: 50, deaths: 1 }),
      match('low-kd', 'de_mirage', { kills: 1, deaths: 50 }),
    ], userA)
    expect(groups[0].kd).toBeCloseTo(51 / 51)
  })

  it('mantém ADR manual média das observações disponíveis e Score existente', () => {
    const records = [
      match('adr-100', 'Mirage', { adr: 100 }),
      match('adr-50', 'de_mirage', { adr: 50 }),
      match('adr-missing', 'Mirage', { adr: null }),
    ]
    const groups = aggregateMapStats(records, userA)
    expect(groups[0].adr).toBe(75)
    expect(groups[0].score).toBe(records.reduce((total, item) => total + performanceScore(item), 0) / records.length)
  })

  it('normaliza mapId histórico apenas, preservando todos os demais campos', () => {
    const historical = match('stable-match-id', 'de_mirage', { kills: 31, adr: 92, playedAt: '2026-10-05T10:11:54.478Z' })
    const before = { ...historical }
    const normalized = { ...historical, mapId: normalizeMapName(historical.mapId).key! }
    const { mapId: _beforeMapId, ...preserved } = before
    const { mapId: _afterMapId, ...after } = normalized
    expect(normalized.mapId).toBe('mirage')
    expect(after).toEqual(preserved)
    expect(normalizeMapName(normalized.mapId).key).toBe(normalized.mapId)
  })

  it('regressão do banco consultado: 9 de_mirage + 4 mirage, sem estimar métricas', () => {
    const records = [
      ...Array.from({ length: 9 }, (_, index) => match(`legacy-demo-${index}`, 'de_mirage', { kills: 125 / 9, deaths: 15 / 9, adr: 64.33333333333333, result: 'win' })),
      ...Array.from({ length: 4 }, (_, index) => match(`legacy-manual-${index}`, 'mirage', { kills: 43 / 4, deaths: 49 / 4, adr: 75.5, result: index < 2 ? 'win' : 'loss' })),
    ]
    const group = aggregateMapStats(records, userA)[0]
    expect(group.total).toBe(13)
    expect(group.wins).toBe(11)
    expect(group.winRate).toBeCloseTo(84.6153846)
    expect(group.kd).toBeCloseTo(168 / 64)
    expect(group.adr).toBeCloseTo((9 * 64.33333333333333 + 4 * 75.5) / 13)
  })
})
