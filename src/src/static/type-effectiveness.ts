import type { NormalizedDataset } from '../importer/normalize.js'

export const SUPER_EFFECTIVE = 1.6
export const NOT_VERY_EFFECTIVE = 0.625
export const IMMUNE = 0.390625

const strongAgainst: Record<string, string[]> = {
  normal: [], fighting: ['normal', 'rock', 'steel', 'ice', 'dark'], flying: ['fighting', 'bug', 'grass'],
  poison: ['grass', 'fairy'], ground: ['poison', 'rock', 'steel', 'fire', 'electric'], rock: ['flying', 'bug', 'fire', 'ice'],
  bug: ['grass', 'psychic', 'dark'], ghost: ['ghost', 'psychic'], steel: ['rock', 'ice', 'fairy'],
  fire: ['bug', 'steel', 'grass', 'ice'], water: ['ground', 'rock', 'fire'], grass: ['ground', 'rock', 'water'],
  electric: ['flying', 'water'], psychic: ['fighting', 'poison'], ice: ['flying', 'ground', 'grass', 'dragon'],
  dragon: ['dragon'], dark: ['ghost', 'psychic'], fairy: ['fighting', 'dragon', 'dark'],
}

const resistedBy: Record<string, string[]> = {
  normal: ['rock', 'steel', 'ghost'], fighting: ['flying', 'poison', 'bug', 'psychic', 'fairy', 'ghost'],
  flying: ['rock', 'steel', 'electric'], poison: ['poison', 'ground', 'rock', 'ghost', 'steel'],
  ground: ['bug', 'grass', 'flying'], rock: ['fighting', 'ground', 'steel'],
  bug: ['fighting', 'flying', 'poison', 'ghost', 'steel', 'fire', 'fairy'], ghost: ['dark', 'normal'],
  steel: ['steel', 'fire', 'water', 'electric'], fire: ['rock', 'fire', 'water', 'dragon'],
  water: ['water', 'grass', 'dragon'], grass: ['flying', 'poison', 'bug', 'steel', 'fire', 'grass', 'dragon'],
  electric: ['grass', 'electric', 'dragon', 'ground'], psychic: ['steel', 'psychic', 'dark'],
  ice: ['steel', 'fire', 'water', 'ice'], dragon: ['steel', 'fairy'], dark: ['fighting', 'dark', 'fairy'],
  fairy: ['poison', 'steel', 'fire'],
}

const immuneTo: Record<string, string[]> = {
  normal: ['ghost'], fighting: ['ghost'], poison: ['steel'], ground: ['flying'], ghost: ['normal'],
  electric: ['ground'], psychic: ['dark'], dragon: ['fairy'],
}

export function attackMultiplier(attackingSlug: string, defendingSlugs: string[]) {
  return defendingSlugs.reduce((multiplier, defendingSlug) => {
    if (strongAgainst[attackingSlug]?.includes(defendingSlug)) return multiplier * SUPER_EFFECTIVE
    if (immuneTo[attackingSlug]?.includes(defendingSlug)) return multiplier * IMMUNE
    if (resistedBy[attackingSlug]?.includes(defendingSlug)) return multiplier * NOT_VERY_EFFECTIVE
    return multiplier
  }, 1)
}

export function defensiveMatchups(typeIds: number[], types: NormalizedDataset['types']) {
  const defendingSlugs = typeIds.map((id) => types.find((type) => type.id === id)?.slug)
    .filter((slug): slug is string => Boolean(slug))
  const all = types.map((type) => ({ ...type, multiplier: attackMultiplier(type.slug, defendingSlugs) }))
  return {
    weaknesses: all.filter((entry) => entry.multiplier > 1).sort((a, b) => b.multiplier - a.multiplier),
    resistances: all.filter((entry) => entry.multiplier < 1).sort((a, b) => a.multiplier - b.multiplier),
  }
}

export function typeEffectiveness(types: NormalizedDataset['types']) {
  return types.map((attacking) => ({
    ...attacking,
    attacks: types.map((defending) => ({
      typeId: defending.id, slug: defending.slug, name: defending.name,
      multiplier: attackMultiplier(attacking.slug, [defending.slug]),
    })),
  }))
}
