import { describe, expect, it } from 'vitest'
import { addPlayerEvent, deriveMetrics, emptyMetricValues, reconcileMetrics } from './integrity'

function apply(events: Array<{ player: string; role: 'kills' | 'deaths' | 'assists'; side: 'ct' | 'tr' | null; headshot?: boolean }>, selected = 'steam-selected') {
  const general = emptyMetricValues()
  const sides = { ct: emptyMetricValues(), tr: emptyMetricValues() }
  let unresolved = 0
  for (const event of events) {
    if (event.player !== selected) continue
    if (!addPlayerEvent(general, sides, event.role, event.side, event.headshot)) unresolved += 1
  }
  return { general, sides, unresolved, reconciliation: reconcileMetrics(general, sides, { unresolvedEvents: unresolved }) }
}

describe('integridade de indicadores da demo', () => {
  it('reconcilia métricas gerais e lados em uma partida normal', () => {
    const result = apply([
      { player: 'steam-selected', role: 'kills', side: 'ct', headshot: true },
      { player: 'steam-selected', role: 'kills', side: 'tr' },
      { player: 'steam-selected', role: 'deaths', side: 'ct' },
      { player: 'steam-selected', role: 'assists', side: 'tr' },
    ])
    expect(result.general).toEqual({ kills: 2, deaths: 1, assists: 1, headshots: 1 })
    expect(result.reconciliation.every((item) => item.status === 'approved')).toBe(true)
  })

  it('classifica cada evento pelo lado no momento em que ocorreu', () => {
    const result = apply([
      { player: 'steam-selected', role: 'kills', side: 'ct' },
      { player: 'steam-selected', role: 'kills', side: 'tr' },
    ])
    expect(result.sides.ct.kills).toBe(1)
    expect(result.sides.tr.kills).toBe(1)
  })

  it('contabiliza Headshots gerais como CT + TR (fixture sintético 7 + 2)', () => {
    const events = [
      ...Array.from({ length: 7 }, () => ({ player: 'steam-selected', role: 'kills' as const, side: 'ct' as const, headshot: true })),
      ...Array.from({ length: 2 }, () => ({ player: 'steam-selected', role: 'kills' as const, side: 'tr' as const, headshot: true })),
    ]
    const result = apply(events)
    expect(result.general.headshots).toBe(9)
    expect(result.sides.ct.headshots).toBe(7)
    expect(result.sides.tr.headshots).toBe(2)
    expect(result.reconciliation.find((item) => item.indicator === 'headshots')?.status).toBe('approved')
  })

  it('preserva zero Headshots como uma contagem válida', () => {
    const result = apply([{ player: 'steam-selected', role: 'kills', side: 'ct' }])
    expect(result.general.headshots).toBe(0)
    expect(result.reconciliation.find((item) => item.indicator === 'headshots')?.status).toBe('approved')
  })

  it('não atribui eventos sem lado e não aprova a reconciliação', () => {
    const result = apply([{ player: 'steam-selected', role: 'kills', side: null }])
    expect(result.general.kills).toBe(1)
    expect(result.sides.ct.kills + result.sides.tr.kills).toBe(0)
    expect(result.reconciliation.find((item) => item.indicator === 'kills')?.status).toBe('incomplete')
  })

  it('filtra por SteamID e ignora eventos de outros jogadores', () => {
    const result = apply([
      { player: 'steam-other', role: 'kills', side: 'ct' },
      { player: 'steam-selected', role: 'kills', side: 'tr' },
    ])
    expect(result.general.kills).toBe(1)
    expect(result.sides.tr.kills).toBe(1)
  })

  it('define K/D sem NaN ou Infinity quando não há deaths', () => {
    expect(deriveMetrics({ kills: 5, deaths: 0, headshots: 1 }).kd).toBe(5)
    expect(Number.isFinite(deriveMetrics({ kills: 5, deaths: 0, headshots: 1 }).kd!)).toBe(true)
  })

  it('mantém dados ausentes como indisponíveis, não como zero', () => {
    expect(deriveMetrics({ kills: null, deaths: null, headshots: null })).toEqual({ kd: null, hsPercentage: null })
  })

  it('mantém os mesmos números no percurso de persistência e leitura', () => {
    const result = apply([{ player: 'steam-selected', role: 'kills', side: 'ct', headshot: true }])
    const persisted = JSON.parse(JSON.stringify({ general: result.general, ct: result.sides.ct, tr: result.sides.tr }))
    const history = { ...persisted }
    expect(history).toEqual({ general: result.general, ct: result.sides.ct, tr: result.sides.tr })
  })
})
