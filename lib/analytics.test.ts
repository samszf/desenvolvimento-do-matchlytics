import { describe, expect, it } from 'vitest'
import { buildInsights, performanceScore, ratio, summarize } from './analytics'

const match = (overrides: Record<string, unknown> = {}) => ({
  result: 'win', playerScore: 13, opponentScore: 9, playedAt: '2026-09-21',
  kills: 20, deaths: 10, adr: 85, kast: 75, mapName: 'mirage', ...overrides,
})

describe('analytics', () => {
  it('calcula K/D sem dividir por zero', () => {
    expect(ratio(20, 10)).toBe(2)
    expect(ratio(20, 0)).toBe(20)
    expect(ratio(null, 2)).toBeNull()
  })

  it('resume partidas e calcula métricas agregadas', () => {
    const summary = summarize([match(), match({ result: 'loss', kills: 10, deaths: 20, adr: 50 })])
    expect(summary.total).toBe(2)
    expect(summary.wins).toBe(1)
    expect(summary.winRate).toBe(50)
    expect(summary.kd).toBe(1)
    expect(summary.adr).toBe(67.5)
  })

  it('mantém score dentro do intervalo esperado', () => {
    expect(performanceScore(match())).toBeGreaterThanOrEqual(0)
    expect(performanceScore(match())).toBeLessThanOrEqual(100)
  })

  it('só gera insights com amostra mínima', () => {
    expect(buildInsights([match()])).toEqual([])
    expect(buildInsights([match(), match({ result: 'loss', kills: 5, deaths: 20 })])).toBeInstanceOf(Array)
  })
})
