export type MetricName = 'kills' | 'deaths' | 'assists' | 'headshots'
export type Side = 'ct' | 'tr'
export type MetricValues = Record<MetricName, number>
export type ReconciliationItem = {
  indicator: MetricName
  general: number | null
  ct: number | null
  tr: number | null
  sideSum: number | null
  difference: number | null
  source: string
  status: 'approved' | 'incomplete' | 'mismatch'
  message: string | null
}

export const emptyMetricValues = (): MetricValues => ({ kills: 0, deaths: 0, assists: 0, headshots: 0 })

export function addPlayerEvent(
  general: MetricValues,
  sides: Record<Side, MetricValues>,
  metric: MetricName,
  side: Side | null,
  headshot = false,
) {
  general[metric] += 1
  if (metric === 'kills' && headshot) general.headshots += 1
  if (!side) return false
  sides[side][metric] += 1
  if (metric === 'kills' && headshot) sides[side].headshots += 1
  return true
}

export function deriveMetrics(values: { kills: number | null; deaths: number | null; headshots: number | null }) {
  return {
    kd: values.kills == null || values.deaths == null ? null : values.deaths > 0 ? values.kills / values.deaths : values.kills,
    hsPercentage: values.kills == null || values.headshots == null || values.kills === 0 ? null : values.headshots / values.kills * 100,
  }
}

export function reconcileMetrics(
  general: MetricValues,
  sides: Record<Side, MetricValues>,
  options: { unresolvedEvents?: number; source?: string } = {},
): ReconciliationItem[] {
  return (['kills', 'deaths', 'assists', 'headshots'] as const).map((indicator) => {
    const ct = sides.ct[indicator]
    const tr = sides.tr[indicator]
    const sideSum = ct + tr
    const difference = general[indicator] - sideSum
    const incomplete = (options.unresolvedEvents ?? 0) > 0
    return {
      indicator,
      general: general[indicator],
      ct,
      tr,
      sideSum,
      difference,
      source: options.source ?? 'eventos player_death',
      status: incomplete ? 'incomplete' : difference === 0 ? 'approved' : 'mismatch',
      message: incomplete ? `${options.unresolvedEvents} evento(s) sem classificação de lado.` : difference === 0 ? null : `Total geral difere da soma CT + TR em ${difference}.`,
    }
  })
}
