import { summarize, type MatchLike } from './analytics'
import { normalizeMapName } from './maps'

export type MapMatch = MatchLike & { id: string; userId: string; mapId: string; assists?: number | null }
export type MapDateFilter = { from?: Date | null; to?: Date | null }

export function aggregateMapStats(matches: MapMatch[], userId: string, filter: MapDateFilter = {}) {
  const groups = new Map<string, { mapKey: string; mapName: string; matches: MapMatch[] }>()

  for (const match of matches) {
    if (match.userId !== userId) continue
    const playedAt = new Date(match.playedAt).getTime()
    if (!Number.isFinite(playedAt)) continue
    if (filter.from && playedAt < filter.from.getTime()) continue
    if (filter.to && playedAt > filter.to.getTime()) continue

    const normalized = normalizeMapName(match.mapId)
    if (!normalized.key || !normalized.name) continue
    const key = `${match.userId}\u0000${normalized.key}`
    const group = groups.get(key) ?? { mapKey: normalized.key, mapName: normalized.name, matches: [] }
    group.matches.push(match)
    groups.set(key, group)
  }

  return [...groups.values()].map(({ mapKey, mapName, matches: groupMatches }) => ({
    mapKey,
    mapName,
    ...summarize(groupMatches),
  })).sort((a, b) => b.total - a.total || a.mapName.localeCompare(b.mapName))
}
