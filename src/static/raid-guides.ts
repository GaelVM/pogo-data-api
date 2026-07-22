import type { NormalizedDataset, NormalizedForm, NormalizedMove } from '../importer/normalize.js'
import type { DataDuckSnapshot } from './dataduck.js'
import { pokemonIdFromAsset } from './availability.js'
import { attackMultiplier, defensiveMatchups } from './type-effectiveness.js'

function record(value: unknown) {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function bestCounterMoves(form: NormalizedForm, bossTypes: string[], dataset: NormalizedDataset) {
  const movesById = new Map(dataset.moves.map((move) => [move.id, move]))
  const typesById = new Map(dataset.types.map((type) => [type.id, type]))
  const moves = form.moves.map((relation) => ({ relation, move: movesById.get(relation.moveId) }))
    .filter((entry): entry is typeof entry & { move: NormalizedMove } => Boolean(entry.move))
  const fast = moves.filter((entry) => entry.move.category === 'FAST' && entry.move.power && entry.move.durationMs && entry.move.energy && entry.move.energy > 0)
  const charged = moves.filter((entry) => entry.move.category === 'CHARGED' && entry.move.power && entry.move.energy && entry.move.energy < 0)
  let best: { score: number; fast: NormalizedMove; charged: NormalizedMove; availability: string[]; effectiveness: number } | undefined
  for (const quick of fast) for (const charge of charged) {
    const quickType = typesById.get(quick.move.typeId ?? -1)?.slug ?? ''
    const chargeType = typesById.get(charge.move.typeId ?? -1)?.slug ?? ''
    const quickMultiplier = attackMultiplier(quickType, bossTypes) * (form.typeIds.includes(quick.move.typeId ?? -1) ? 1.2 : 1)
    const chargeMultiplier = attackMultiplier(chargeType, bossTypes) * (form.typeIds.includes(charge.move.typeId ?? -1) ? 1.2 : 1)
    const energyCost = Math.abs(charge.move.energy!)
    const fastUses = Math.max(1, Math.ceil(energyCost / quick.move.energy!))
    const damage = fastUses * quick.move.power! * quickMultiplier + charge.move.power! * chargeMultiplier
    const seconds = fastUses * quick.move.durationMs! / 1000 + Math.max(0.5, (charge.move.durationMs ?? 1000) / 1000)
    const cycleDps = damage / seconds
    const score = cycleDps * (form.attack ?? 0)
    if (!best || score > best.score) best = { score, fast: quick.move, charged: charge.move, availability: [quick.relation.availability, charge.relation.availability], effectiveness: chargeMultiplier }
  }
  return best
}

export function raidGuides(dataset: NormalizedDataset, dataDuck?: DataDuckSnapshot) {
  const pokemonById = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon]))
  const defaultForms = dataset.forms.filter((form) => form.isDefault && !form.isCostume && form.attack)
  return (dataDuck?.raids ?? []).flatMap((rawRaid) => {
    const raid = record(rawRaid)
    const pokemonId = pokemonIdFromAsset(raid.image)
    const pokemon = pokemonId ? pokemonById.get(pokemonId) : undefined
    if (!pokemonId || !pokemon) return []
    const raidTypes = Array.isArray(raid.types) ? raid.types.map((type) => String(record(type).name)).filter(Boolean) : []
    const bossForm = defaultForms.find((form) => form.pokemonId === pokemonId)
    const bossTypes = raidTypes.length ? raidTypes : (bossForm?.typeIds.map((id) => dataset.types.find((type) => type.id === id)?.slug).filter((slug): slug is string => Boolean(slug)) ?? [])
    const matchups = defensiveMatchups(bossTypes.map((slug) => dataset.types.find((type) => type.slug === slug)?.id).filter((id): id is number => id !== undefined), dataset.types)
    const counters = defaultForms.flatMap((form) => {
      const counterPokemon = pokemonById.get(form.pokemonId)
      const moveset = bestCounterMoves(form, bossTypes, dataset)
      return counterPokemon && moveset ? [{
        pokemonId: counterPokemon.id, pokemonName: counterPokemon.name, formId: form.formId, formName: form.name,
        score: Math.round(moveset.score), fastMove: { id: moveset.fast.id, name: moveset.fast.name, availability: moveset.availability[0] },
        chargedMove: { id: moveset.charged.id, name: moveset.charged.name, availability: moveset.availability[1] },
        effectiveness: Number(moveset.effectiveness.toFixed(3)),
      }] : []
    }).sort((a, b) => b.score - a.score).slice(0, 25).map((entry, index, all) => ({
      rank: index + 1, rating: Number((entry.score / (all[0]?.score ?? 1) * 100).toFixed(2)), ...entry,
    }))
    return [{ pokemonId, pokemonName: pokemon.name, raid, weaknesses: matchups.weaknesses, resistances: matchups.resistances, counters,
      methodology: 'Counters analíticos por DPS de ciclo, ataque, STAB y efectividad. No simula dodges, relobbies, amistad, clima ni cantidad exacta de jugadores.' }]
  })
}

