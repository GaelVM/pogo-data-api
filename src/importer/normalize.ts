import slugify from 'slugify'
import type {
  Dictionary,
  MasterEvolution,
  MasterForm,
  MasterMoveReference,
  MasterPokemon,
  Masterfile,
} from './types.js'

export const makeSlug = (value: string) =>
  slugify(value, { lower: true, strict: true, locale: 'es' })

export interface NormalizedMove {
  id: number
  slug: string
  name: string
  proto?: string
  category: 'FAST' | 'CHARGED' | 'UNKNOWN'
  typeId?: number
  power?: number
  energy?: number
  durationMs?: number
}

export interface NormalizedForm {
  pokemonId: number
  formId: number
  slug: string
  name: string
  proto?: string
  isDefault: boolean
  isCostume: boolean
  attack?: number
  defense?: number
  stamina?: number
  height?: number
  weight?: number
  buddyDistance?: number
  thirdMoveStardust?: number
  thirdMoveCandy?: number
  tradable?: boolean
  transferable?: boolean
  typeIds: number[]
  moves: Array<{ moveId: number; availability: 'NORMAL' }>
  evolutions: MasterEvolution[]
}

export interface NormalizedDataset {
  pokemon: Array<{
    id: number
    slug: string
    name: string
    generation?: number
    generationName?: string
    familyId?: number
    legendary: boolean
    mythic: boolean
    ultraBeast: boolean
  }>
  forms: NormalizedForm[]
  types: Array<{ id: number; slug: string; name: string }>
  moves: NormalizedMove[]
}

function values<T>(dictionary?: Dictionary<T>): T[] {
  return dictionary ? Object.values(dictionary) : []
}

function mergeMove(
  target: Map<number, NormalizedMove>,
  move: MasterMoveReference,
  category: 'FAST' | 'CHARGED',
) {
  const current = target.get(move.moveId)
  target.set(move.moveId, {
    id: move.moveId,
    slug: `${makeSlug(move.moveName)}-${move.moveId}`,
    name: move.moveName,
    proto: move.proto ?? current?.proto,
    category: current?.category === 'UNKNOWN' ? category : (current?.category ?? category),
    typeId: move.type ?? current?.typeId,
    power: move.power ?? current?.power,
    energy: move.energy ?? current?.energy,
    durationMs: move.duration ?? current?.durationMs,
  })
}

function normalizeForm(
  pokemon: MasterPokemon,
  form: MasterForm,
  moves: Map<number, NormalizedMove>,
): NormalizedForm {
  const pokemonSlug = makeSlug(pokemon.name)
  const formMoves = {
    quick: form.quickMoves ?? pokemon.quickMoves,
    charged: form.chargedMoves ?? pokemon.chargedMoves,
  }

  values(formMoves.quick).forEach((move) => mergeMove(moves, move, 'FAST'))
  values(formMoves.charged).forEach((move) => mergeMove(moves, move, 'CHARGED'))

  const relations = [
    ...values(formMoves.quick).map((move) => ({ moveId: move.moveId, availability: 'NORMAL' as const })),
    ...values(formMoves.charged).map((move) => ({ moveId: move.moveId, availability: 'NORMAL' as const })),
  ]

  const stats = form.stats ?? pokemon.stats
  const types = form.types ?? pokemon.types

  return {
    pokemonId: pokemon.pokedexId,
    formId: form.form,
    slug: `${pokemonSlug}-${makeSlug(form.name || String(form.form))}`,
    name: form.name || 'Normal',
    proto: form.proto,
    isDefault: form.form === pokemon.defaultFormId,
    isCostume: form.isCostume ?? false,
    attack: stats?.attack,
    defense: stats?.defense,
    stamina: stats?.stamina,
    height: form.height ?? pokemon.height,
    weight: form.weight ?? pokemon.weight,
    buddyDistance: pokemon.misc?.buddyDistance,
    thirdMoveStardust: pokemon.misc?.thirdMoveStardust,
    thirdMoveCandy: pokemon.misc?.thirdMoveCandy,
    tradable: pokemon.misc?.tradable,
    transferable: pokemon.misc?.transferable,
    typeIds: values(types).map((type) => type.typeId).filter((id) => id > 0),
    moves: [...new Map(relations.map((relation) => [relation.moveId, relation])).values()],
    evolutions: values(form.evolutions ?? (form.form === pokemon.defaultFormId ? pokemon.evolutions : undefined)),
  }
}

export function normalizeMasterfile(masterfile: Masterfile): NormalizedDataset {
  if (!masterfile.pokemon || !masterfile.types || !masterfile.moves) {
    throw new Error('El archivo no contiene pokemon, types y moves')
  }

  const moves = new Map<number, NormalizedMove>()
  values(masterfile.moves).forEach((move) => {
    moves.set(move.id, {
      id: move.id,
      slug: `${makeSlug(move.name || 'unknown')}-${move.id}`,
      name: move.name || 'Unknown',
      proto: move.proto,
      category: move.proto?.endsWith('_FAST') ? 'FAST' : 'UNKNOWN',
      typeId: move.type,
      power: move.power,
      energy: move.energy,
      durationMs: move.duration,
    })
  })

  const pokemon = values(masterfile.pokemon)
    .filter((entry) => entry.pokedexId > 0)
    .map((entry) => ({
      id: entry.pokedexId,
      slug: makeSlug(entry.name),
      name: entry.name,
      generation: entry.genId,
      generationName: entry.generation,
      familyId: entry.family,
      legendary: entry.legendary ?? false,
      mythic: entry.mythic ?? false,
      ultraBeast: entry.ultraBeast ?? false,
    }))

  const forms = values(masterfile.pokemon)
    .filter((entry) => entry.pokedexId > 0)
    .flatMap((entry) => {
      const availableForms = values(entry.forms).filter((form) => form.form > 0)
      if (availableForms.length > 0) return availableForms.map((form) => normalizeForm(entry, form, moves))

      const fallbackForm: MasterForm = {
        name: 'Normal',
        form: entry.defaultFormId ?? entry.pokedexId,
      }
      return [normalizeForm(entry, fallbackForm, moves)]
    })

  return {
    pokemon,
    forms,
    types: values(masterfile.types)
      .filter((type) => type.typeId > 0)
      .map((type) => ({ id: type.typeId, slug: makeSlug(type.typeName), name: type.typeName })),
    moves: [...moves.values()].filter((move) => move.id > 0),
  }
}
