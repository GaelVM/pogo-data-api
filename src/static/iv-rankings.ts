import type { NormalizedDataset, NormalizedForm } from '../importer/normalize.js'
import { calculateCp, LEVELS } from './combat.js'

export type LeagueKey = 'great' | 'ultra' | 'master'
const LEAGUES: Record<LeagueKey, { name: string; cpCap?: number }> = {
  great: { name: 'Liga Super', cpCap: 1500 },
  ultra: { name: 'Liga Ultra', cpCap: 2500 },
  master: { name: 'Liga Master' },
}

function effectiveStats(form: NormalizedForm, ivs: { attack: number; defense: number; stamina: number }, cpm: number) {
  const attack = (form.attack! + ivs.attack) * cpm
  const defense = (form.defense! + ivs.defense) * cpm
  const stamina = Math.floor((form.stamina! + ivs.stamina) * cpm)
  return { attack, defense, stamina, statProduct: attack * defense * stamina }
}

export function ivRankingsForForm(form: NormalizedForm, leagueKey: LeagueKey, limit = 100) {
  if (form.attack === undefined || form.defense === undefined || form.stamina === undefined) return []
  const league = LEAGUES[leagueKey]
  const stats = { attack: form.attack, defense: form.defense, stamina: form.stamina }
  const entries = []
  for (let attack = 0; attack <= 15; attack++) for (let defense = 0; defense <= 15; defense++) for (let stamina = 0; stamina <= 15; stamina++) {
    const ivs = { attack, defense, stamina }
    let levelIndex = LEVELS.length - 1
    if (league.cpCap) {
      let low = 0; let high = LEVELS.length - 1; levelIndex = -1
      while (low <= high) {
        const middle = (low + high) >> 1
        if (calculateCp(stats, ivs, LEVELS[middle]!.cpm) <= league.cpCap) { levelIndex = middle; low = middle + 1 } else high = middle - 1
      }
    }
    if (levelIndex < 0) continue
    const level = LEVELS[levelIndex]!
    const cp = calculateCp(stats, ivs, level.cpm)
    if (league.cpCap && cp < league.cpCap * 0.75) continue
    const effective = effectiveStats(form, ivs, level.cpm)
    entries.push({ ivs, level: level.level, cp, attack: effective.attack, defense: effective.defense, stamina: effective.stamina, statProduct: effective.statProduct })
  }
  entries.sort((a, b) => b.statProduct - a.statProduct)
  const best = entries[0]?.statProduct ?? 1
  return entries.slice(0, limit).map((entry, index) => ({
    rank: index + 1, percentage: Number((entry.statProduct / best * 100).toFixed(3)),
    ivs: entry.ivs, level: entry.level, cp: entry.cp,
    effectiveStats: { attack: Number(entry.attack.toFixed(3)), defense: Number(entry.defense.toFixed(3)), stamina: entry.stamina },
    statProduct: Math.round(entry.statProduct),
  }))
}

export function ivRankingFiles(dataset: NormalizedDataset) {
  const pokemonById = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon]))
  const forms = dataset.forms.filter((form) => form.isDefault && !form.isCostume && form.attack !== undefined)
  return forms.flatMap((form) => {
    const pokemon = pokemonById.get(form.pokemonId)
    return pokemon ? (Object.keys(LEAGUES) as LeagueKey[]).map((league) => ({
      league, pokemonId: pokemon.id, pokemonName: pokemon.name, formId: form.formId, formName: form.name,
      cpCap: LEAGUES[league].cpCap ?? null, totalIvCombinations: 4096,
      rankings: ivRankingsForForm(form, league),
    })) : []
  })
}

export function ivCalculatorConfig() {
  return { leagues: LEAGUES, maxLevel: 50, levels: LEVELS, ivRange: { minimum: 0, maximum: 15 }, formula: 'floor((attack+ivAttack)*sqrt(defense+ivDefense)*sqrt(stamina+ivStamina)*cpm^2/10)' }
}

