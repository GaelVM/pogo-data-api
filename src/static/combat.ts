import type { NormalizedDataset, NormalizedForm } from '../importer/normalize.js'

export const CP_MULTIPLIERS = {
  40: 0.79030001,
  50: 0.84029999,
} as const

const INTEGER_LEVEL_CPMS = [
  0.094, 0.16639787, 0.21573247, 0.25572005, 0.29024988, 0.3210876, 0.34921268, 0.3752356,
  0.39956728, 0.42250001, 0.44310755, 0.46279839, 0.48168495, 0.49985844, 0.51739395,
  0.53435433, 0.55079269, 0.56675452, 0.58227891, 0.59740001, 0.61215729, 0.62656713,
  0.64065295, 0.65443563, 0.667934, 0.68116492, 0.69414365, 0.70688421, 0.71939909, 0.7317,
  0.73776948, 0.74378943, 0.74976104, 0.75568551, 0.76156384, 0.76739717, 0.7731865,
  0.77893275, 0.78463697, 0.79030001, 0.7953, 0.8003, 0.8053, 0.81029999, 0.81529999,
  0.82029999, 0.82529999, 0.83029999, 0.83529999, 0.84029999,
]

export const LEVELS = INTEGER_LEVEL_CPMS.flatMap((cpm, index) => {
  const level = index + 1
  const next = INTEGER_LEVEL_CPMS[index + 1]
  return next ? [{ level, cpm }, { level: level + 0.5, cpm: Math.sqrt((cpm ** 2 + next ** 2) / 2) }] : [{ level, cpm }]
})

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

function bestLeagueSpread(form: NormalizedForm, cpCap: number | undefined) {
  if (form.attack === undefined || form.defense === undefined || form.stamina === undefined) return undefined
  const stats = { attack: form.attack, defense: form.defense, stamina: form.stamina }
  const maxLevel = LEVELS.at(-1)!
  if (!cpCap) {
    const ivs = { attack: 15, defense: 15, stamina: 15 }
    return {
      level: maxLevel.level, ivs, cp: calculateCp(stats, ivs, maxLevel.cpm),
      statProduct: (stats.attack + 15) * maxLevel.cpm * (stats.defense + 15) * maxLevel.cpm
        * Math.floor((stats.stamina + 15) * maxLevel.cpm),
    }
  }
  let best: { level: number; ivs: IndividualValues; cp: number; statProduct: number } | undefined
  for (let attack = 0; attack <= 15; attack++) for (let defense = 0; defense <= 15; defense++) for (let stamina = 0; stamina <= 15; stamina++) {
    const ivs = { attack, defense, stamina }
    let low = 0; let high = LEVELS.length - 1; let levelIndex = -1
    while (low <= high) {
      const middle = (low + high) >> 1
      if (calculateCp(stats, ivs, LEVELS[middle]!.cpm) <= cpCap) { levelIndex = middle; low = middle + 1 } else high = middle - 1
    }
    if (levelIndex < 0) continue
    const candidate = LEVELS[levelIndex]!
    const statProduct = (stats.attack + attack) * candidate.cpm * (stats.defense + defense) * candidate.cpm
      * Math.floor((stats.stamina + stamina) * candidate.cpm)
    if (!best || statProduct > best.statProduct) best = { level: candidate.level, ivs, cp: calculateCp(stats, ivs, candidate.cpm), statProduct }
  }
  return best
}

export function pvpRankings(dataset: NormalizedDataset) {
  const pokemonById = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon]))
  const eligible = dataset.forms.filter((form) => form.isDefault && !form.isCostume)
  const league = (name: string, cpCap?: number) => {
    const entries = eligible.flatMap((form) => {
      const pokemon = pokemonById.get(form.pokemonId)
      const best = bestLeagueSpread(form, cpCap)
      return pokemon && best ? [{ pokemonId: pokemon.id, pokemonName: pokemon.name, pokemonSlug: pokemon.slug,
        formId: form.formId, formName: form.name, ...best }] : []
    }).filter((entry) => !cpCap || entry.cp >= cpCap * 0.75)
      .sort((a, b) => b.statProduct - a.statProduct)
    const leader = entries[0]?.statProduct ?? 1
    return { name, cpCap: cpCap ?? null, rankings: entries.slice(0, 100).map((entry, index) => ({
      rank: index + 1, score: Number((entry.statProduct / leader * 100).toFixed(2)), ...entry,
      statProduct: Math.round(entry.statProduct),
    })) }
  }
  return {
    methodology: 'Ranking analítico por máximo producto estadístico bajo el límite de CP. No simula movimientos, enfrentamientos ni el metajuego de PvPoke.',
    maxLevel: 50,
    leagues: {
      great: league('Liga Super', 1500),
      ultra: league('Liga Ultra', 2500),
      master: league('Liga Master'),
    },
  }
}
