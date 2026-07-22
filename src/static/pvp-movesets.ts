import type { NormalizedDataset, NormalizedMove } from '../importer/normalize.js'
import type { pvpRankings } from './combat.js'

type Rankings = ReturnType<typeof pvpRankings>

function fastMetrics(move: NormalizedMove, stab: boolean) {
  const turns = Math.max(1, (move.pvpDurationTurns ?? 0) + 1)
  const power = move.pvpPower ?? move.power ?? 0
  const energy = Math.max(0, move.pvpEnergy ?? move.energy ?? 0)
  const damagePerTurn = power * (stab ? 1.2 : 1) / turns
  const energyPerTurn = energy / turns
  return { damagePerTurn: Number(damagePerTurn.toFixed(3)), energyPerTurn: Number(energyPerTurn.toFixed(3)), score: damagePerTurn + energyPerTurn * 1.35 }
}

function chargedMetrics(move: NormalizedMove, stab: boolean) {
  const power = move.pvpPower ?? move.power ?? 0
  const energyCost = Math.abs(move.pvpEnergy ?? move.energy ?? 0)
  const damagePerEnergy = energyCost ? power * (stab ? 1.2 : 1) / energyCost : 0
  const pressure = energyCost ? Math.max(0, 60 - energyCost) / 60 : 0
  const buffBonus = move.pvpBuffs ? 0.12 : 0
  return { energyCost, damagePerEnergy: Number(damagePerEnergy.toFixed(3)), score: damagePerEnergy + pressure * 0.35 + buffBonus }
}

export function pvpMovesets(dataset: NormalizedDataset, rankings: Rankings) {
  const movesById = new Map(dataset.moves.map((move) => [move.id, move]))
  const pokemonById = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon]))
  const leagueScores = new Map<string, Map<string, number>>()
  for (const [leagueKey, league] of Object.entries(rankings.leagues)) {
    leagueScores.set(leagueKey, new Map(league.rankings.map((entry) => [`${entry.pokemonId}:${entry.formId}`, entry.score])))
  }

  const entries = dataset.forms.filter((form) => form.isDefault && !form.isCostume).flatMap((form) => {
    const pokemon = pokemonById.get(form.pokemonId)
    if (!pokemon) return []
    const available = form.moves.map((relation) => ({ relation, move: movesById.get(relation.moveId) })).filter((entry): entry is typeof entry & { move: NormalizedMove } => Boolean(entry.move))
    const fast = available.filter((entry) => entry.move.category === 'FAST').map((entry) => ({
      id: entry.move.id, name: entry.move.name, typeId: entry.move.typeId, availability: entry.relation.availability,
      ...fastMetrics(entry.move, entry.move.typeId !== undefined && form.typeIds.includes(entry.move.typeId)),
    })).sort((a, b) => b.score - a.score)
    const charged = available.filter((entry) => entry.move.category === 'CHARGED').map((entry) => ({
      id: entry.move.id, name: entry.move.name, typeId: entry.move.typeId, availability: entry.relation.availability,
      ...chargedMetrics(entry.move, entry.move.typeId !== undefined && form.typeIds.includes(entry.move.typeId)),
    })).filter((move) => move.energyCost > 0).sort((a, b) => b.score - a.score)
    if (!fast.length || !charged.length) return []
    const firstCharged = charged[0]!
    const secondCharged = charged.find((move) => move.typeId !== firstCharged.typeId) ?? charged[1]
    const selectedCharged = secondCharged ? [firstCharged, secondCharged] : [firstCharged]
    const recommendation = { fast: fast[0]!, charged: selectedCharged }
    return [{
      pokemonId: pokemon.id, pokemonName: pokemon.name, pokemonSlug: pokemon.slug, formId: form.formId, formName: form.name,
      recommendation,
      alternatives: { fast: fast.slice(1, 4), charged: charged.filter((move) => !recommendation.charged.some((selected) => selected.id === move.id)).slice(0, 4) },
      leagueScores: Object.fromEntries([...leagueScores].map(([key, scores]) => [key, scores.get(`${form.pokemonId}:${form.formId}`) ?? null])),
    }]
  })
  return {
    methodology: 'Heurística transparente basada en daño por turno, energía por turno, daño por energía, STAB, presión y cobertura de tipos. No es una simulación de combates.',
    entries,
  }
}
