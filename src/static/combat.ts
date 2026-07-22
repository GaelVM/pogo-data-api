import type { NormalizedDataset, NormalizedForm } from '../importer/normalize.js'

export const CP_MULTIPLIERS = {
  40: 0.79030001,
  50: 0.84029999,
} as const

export interface IndividualValues {
  attack: number
  defense: number
  stamina: number
}

export function calculateCp(
  stats: { attack: number; defense: number; stamina: number },
  ivs: IndividualValues,
  cpMultiplier: number,
) {
  const cp = Math.floor(
    ((stats.attack + ivs.attack)
      * Math.sqrt(stats.defense + ivs.defense)
      * Math.sqrt(stats.stamina + ivs.stamina)
      * cpMultiplier ** 2) / 10,
  )
  return Math.max(10, cp)
}

export function formCombat(form: NormalizedForm) {
  if (form.attack === undefined || form.defense === undefined || form.stamina === undefined) return undefined
  const stats = { attack: form.attack, defense: form.defense, stamina: form.stamina }
  const perfect = { attack: 15, defense: 15, stamina: 15 }
  return {
    baseStatTotal: form.attack + form.defense + form.stamina,
    statProduct: form.attack * form.defense * form.stamina,
    bulk: form.defense * form.stamina,
    maxCp: {
      level40: calculateCp(stats, perfect, CP_MULTIPLIERS[40]),
      level50: calculateCp(stats, perfect, CP_MULTIPLIERS[50]),
    },
  }
}

export function combatDataset(dataset: NormalizedDataset) {
  const pokemonById = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon]))
  return dataset.forms.flatMap((form) => {
    const combat = formCombat(form)
    const pokemon = pokemonById.get(form.pokemonId)
    return combat && pokemon ? [{
      pokemonId: form.pokemonId,
      pokemonSlug: pokemon.slug,
      pokemonName: pokemon.name,
      formId: form.formId,
      formSlug: form.slug,
      formName: form.name,
      isDefault: form.isDefault,
      isCostume: form.isCostume,
      attack: form.attack,
      defense: form.defense,
      stamina: form.stamina,
      ...combat,
    }] : []
  })
}

function ranked<T extends Record<string, unknown>>(entries: T[], field: keyof T, limit = 100) {
  return [...entries]
    .sort((a, b) => Number(b[field]) - Number(a[field]))
    .slice(0, limit)
    .map((entry, index) => ({ rank: index + 1, ...entry }))
}

export function combatRankings(dataset: NormalizedDataset) {
  const eligible = combatDataset(dataset).filter((entry) => entry.isDefault && !entry.isCostume)
  const flattened = eligible.map((entry) => ({ ...entry, maxCp40: entry.maxCp.level40, maxCp50: entry.maxCp.level50 }))
  return {
    scope: 'Top 100 de formas predeterminadas sin disfraces; no representa rankings PvP por liga.',
    byAttack: ranked(flattened, 'attack'),
    byDefense: ranked(flattened, 'defense'),
    byStamina: ranked(flattened, 'stamina'),
    byBulk: ranked(flattened, 'bulk'),
    byStatProduct: ranked(flattened, 'statProduct'),
    byMaxCp50: ranked(flattened, 'maxCp50'),
  }
}
