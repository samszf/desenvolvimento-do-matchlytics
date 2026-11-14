export type KnownMap = { key: string; name: string; aliases: readonly string[] }

export const SUPPORTED_MAPS: readonly KnownMap[] = [
  { key: 'mirage', name: 'Mirage', aliases: ['mirage', 'de_mirage'] },
  { key: 'inferno', name: 'Inferno', aliases: ['inferno', 'de_inferno'] },
  { key: 'ancient', name: 'Ancient', aliases: ['ancient', 'de_ancient'] },
  { key: 'nuke', name: 'Nuke', aliases: ['nuke', 'de_nuke'] },
  { key: 'dust2', name: 'Dust 2', aliases: ['dust2', 'dust_2', 'dust-2', 'dust 2', 'de_dust2', 'de_dust_2', 'de_dust-2'] },
  { key: 'anubis', name: 'Anubis', aliases: ['anubis', 'de_anubis'] },
  { key: 'vertigo', name: 'Vertigo', aliases: ['vertigo', 'de_vertigo'] },
]

export type NormalizedMap = { key: string | null; name: string | null; known: boolean }

function comparableMapName(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-US').trim().replace(/[ _-]+/g, ' ')
}

function unknownMapLabel(value: string) {
  return value.replace(/[ _-]+/g, ' ').trim().replace(/\s+/g, ' ').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'))
}

const aliases = new Map(SUPPORTED_MAPS.flatMap((map) => map.aliases.map((alias) => [comparableMapName(alias), map] as const)))

export function normalizeMapName(value: unknown): NormalizedMap {
  if (typeof value !== 'string' || !value.trim()) return { key: null, name: null, known: false }
  const raw = value.trim()
  const map = aliases.get(comparableMapName(raw))
  if (map) return { key: map.key, name: map.name, known: true }
  const key = comparableMapName(raw).replace(/\s+/g, '-')
  return { key: key || null, name: unknownMapLabel(raw) || null, known: false }
}
