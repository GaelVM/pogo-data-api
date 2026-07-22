import slugify from 'slugify'
import type {
  Dictionary,
  MasterEvolution,
  MasterForm,
  MasterMoveReference,
  MasterPokemon,
  MasterTemporaryEvolution,
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
  pvpPower?: number
  pvpEnergy?: number
  pvpDurationTurns?: number
  pvpBuffs?: unknown
  metrics: {
    pveDps?: number
    pveEnergyPerSecond?: number
    pveDamagePerEnergy?: number
    pvpDamagePerEnergy?: number
  }
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
  moves: Array<{ moveId: number; availability: 'NORMAL' | 'ELITE' }>
  evolutions: MasterEvolution[]
  temporaryEvolutions: MasterTemporaryEvolution[]
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
    unreleased: boolean
  }>
  forms: NormalizedForm[]
  types: Array<{ id: number; slug: string; name: string }>
  moves: NormalizedMove[]
}

function values<T>(dictionary?: Dictionary<T>): T[] {
  return dictionary ? Object.values(dictionary) : []
}

type LooseRecord = Record<string, unknown>

function record(value: unknown): LooseRecord {
  return value !== null && typeof value === 'object' ? (value as LooseRecord) : {}
}

function field<T>(source: LooseRecord, ...names: string[]): T | undefined {
  for (const name of names) if (source[name] !== undefined) return source[name] as T
  return undefined
}

function normalizeTypes(source: unknown): Dictionary<{ typeId: number; typeName: string }> {
  return Object.fromEntries(
    Object.entries(record(source)).flatMap(([key, value]) => {
      const item = record(value)
      const typeId = Number(field(item, 'typeId', 'type_id') ?? key)
      const typeName = typeof value === 'string' ? value : field<string>(item, 'typeName', 'type_name', 'name')
      return typeId > 0 && typeName ? [[String(typeId), { typeId, typeName }]] : []
    }),
  )
}

function normalizeMoveReferences(source: unknown): Dictionary<MasterMoveReference> {
  return Object.fromEntries(
    Object.entries(record(source)).flatMap(([key, value]) => {
      const item = record(value)
      const moveId = Number(field(item, 'moveId', 'move_id', 'id') ?? key)
      const moveName = typeof value === 'string' ? value : field<string>(item, 'moveName', 'move_name', 'name')
      if (!(moveId > 0) || !moveName) return []
      return [[String(moveId), {
        moveId,
        moveName,
        proto: field(item, 'proto'),
        type: field(item, 'typeId', 'type_id', 'type'),
        power: field(item, 'power'),
        energy: field(item, 'energy'),
        duration: field(item, 'duration', 'durationMs', 'duration_ms'),
      }]]
    }),
  )
}

function normalizeEvolutions(source: unknown): Dictionary<MasterEvolution> {
  const entries = Array.isArray(source) ? source.entries() : Object.entries(record(source))
  return Object.fromEntries(
    [...entries].flatMap(([key, value]) => {
      const item = record(value)
      const pokemon = Number(field(item, 'pokemon', 'evoId', 'evo_id') ?? key)
      if (!(pokemon > 0)) return []
      return [[String(key), {
        pokemon,
        form: field(item, 'form', 'formId', 'form_id'),
        candyCost: field(item, 'candyCost', 'candy_cost'),
        item: field(item, 'item', 'itemRequirement', 'item_requirement'),
      }]]
    }),
  )
}

function normalizeTemporaryEvolutions(source: unknown): Dictionary<MasterTemporaryEvolution> {
  const entries = Array.isArray(source) ? source.entries() : Object.entries(record(source))
  return Object.fromEntries([...entries].flatMap(([key, value]) => {
    const item = record(value)
    const id = Number(field(item, 'id', 'tempEvoId', 'temp_evo_id') ?? key)
    if (!(id > 0)) return []
    return [[String(id), {
      id,
      attack: field(item, 'attack'), defense: field(item, 'defense'), stamina: field(item, 'stamina'),
      height: field(item, 'height'), weight: field(item, 'weight'),
      typeIds: Object.values(normalizeTypes(item.types)).map((type) => type.typeId),
      unreleased: field(item, 'unreleased'),
      firstEnergyCost: field(item, 'firstEnergyCost', 'first_energy_cost'),
      subsequentEnergyCost: field(item, 'subsequentEnergyCost', 'subsequent_energy_cost'),
    }]]
  }))
}

function optionalDictionary<T>(source: unknown, convert: (value: unknown) => Dictionary<T>) {
  return source === undefined ? undefined : convert(source)
}

function stats(source: LooseRecord) {
  const nested = record(source.stats)
  const result = {
    attack: field<number>(source, 'attack') ?? field<number>(nested, 'attack'),
    defense: field<number>(source, 'defense') ?? field<number>(nested, 'defense'),
    stamina: field<number>(source, 'stamina') ?? field<number>(nested, 'stamina'),
  }
  return Object.values(result).some((value) => value !== undefined) ? result : undefined
}

function adaptGeneratedMasterfile(input: Masterfile): Masterfile {
  const raw = input as unknown as LooseRecord
  const types = normalizeTypes(raw.types)
  const pokemon = Object.fromEntries(
    Object.entries(record(raw.pokemon)).flatMap(([key, value]) => {
      const item = record(value)
      const pokedexId = Number(field(item, 'pokedexId', 'pokedex_id') ?? key)
      const name = field<string>(item, 'name', 'pokemonName', 'pokemon_name')
      if (!(pokedexId > 0) || !name) return []
      const forms = Object.fromEntries(Object.entries(record(item.forms)).map(([formKey, formValue]) => {
        const form = record(formValue)
        const formId = Number(field(form, 'form', 'formId', 'form_id') ?? formKey)
        return [formKey, {
          name: field<string>(form, 'name', 'formName', 'form_name') ?? 'Normal',
          proto: field<string>(form, 'proto'),
          form: formId,
          isCostume: field<boolean>(form, 'isCostume', 'is_costume'),
          stats: stats(form),
          types: optionalDictionary(form.types, normalizeTypes),
          quickMoves: optionalDictionary(field(form, 'quickMoves', 'quick_moves'), normalizeMoveReferences),
          chargedMoves: optionalDictionary(field(form, 'chargedMoves', 'charged_moves'), normalizeMoveReferences),
          eliteQuickMoves: optionalDictionary(field(form, 'eliteQuickMoves', 'elite_quick_moves'), normalizeMoveReferences),
          eliteChargedMoves: optionalDictionary(field(form, 'eliteChargedMoves', 'elite_charged_moves'), normalizeMoveReferences),
          evolutions: optionalDictionary(form.evolutions, normalizeEvolutions),
          temporaryEvolutions: optionalDictionary(field(form, 'tempEvolutions', 'temp_evolutions'), normalizeTemporaryEvolutions),
          height: field<number>(form, 'height'),
          weight: field<number>(form, 'weight'),
        }]
      }))
      return [[key, {
        name,
        pokedexId,
        defaultFormId: field(item, 'defaultFormId', 'default_form_id'),
        genId: field(item, 'genId', 'gen_id'),
        generation: field(item, 'generation'),
        family: field(item, 'family'),
        legendary: field(item, 'legendary'),
        mythic: field(item, 'mythic'),
        ultraBeast: field(item, 'ultraBeast', 'ultra_beast'),
        unreleased: field(item, 'unreleased'),
        stats: stats(item),
        types: optionalDictionary(item.types, normalizeTypes),
        forms,
        quickMoves: normalizeMoveReferences(field(item, 'quickMoves', 'quick_moves')),
        chargedMoves: normalizeMoveReferences(field(item, 'chargedMoves', 'charged_moves')),
        eliteQuickMoves: optionalDictionary(field(item, 'eliteQuickMoves', 'elite_quick_moves'), normalizeMoveReferences),
        eliteChargedMoves: optionalDictionary(field(item, 'eliteChargedMoves', 'elite_charged_moves'), normalizeMoveReferences),
        evolutions: optionalDictionary(item.evolutions, normalizeEvolutions),
        temporaryEvolutions: optionalDictionary(field(item, 'tempEvolutions', 'temp_evolutions'), normalizeTemporaryEvolutions),
        height: field(item, 'height'),
        weight: field(item, 'weight'),
        misc: {
          buddyDistance: field(item, 'buddyDistance', 'buddy_distance'),
          thirdMoveStardust: field(item, 'thirdMoveStardust', 'third_move_stardust'),
          thirdMoveCandy: field(item, 'thirdMoveCandy', 'third_move_candy'),
          tradable: field(item, 'tradable'),
          transferable: field(item, 'transferable'),
        },
      }]]
    }),
  )
  const typeIdByName = new Map(Object.values(types).map((type) => [makeSlug(type.typeName), type.typeId]))
  const moves = Object.fromEntries(Object.entries(record(raw.moves)).flatMap(([key, value]) => {
    const item = record(value)
    const id = Number(field(item, 'id', 'moveId', 'move_id') ?? key)
    const name = field<string>(item, 'name', 'moveName', 'move_name')
    if (!(id > 0) || !name) return []
    const rawType = field<unknown>(item, 'type', 'typeId', 'type_id')
    const typeObject = record(rawType)
    const type = typeof rawType === 'number' ? rawType
      : typeof rawType === 'string' ? typeIdByName.get(makeSlug(rawType))
      : field<number>(typeObject, 'typeId', 'type_id', 'id')
    return [[key, {
      id, name, proto: field(item, 'proto'), type, power: field(item, 'power'),
      energy: field(item, 'energy', 'energyDelta', 'energy_delta'),
      duration: field(item, 'duration', 'durationMs', 'duration_ms'),
      pvpPower: field(item, 'pvpPower', 'pvp_power'),
      pvpEnergy: field(item, 'pvpEnergy', 'pvpEnergyDelta', 'pvp_energy', 'pvp_energy_delta'),
      pvpDurationTurns: field(item, 'pvpDurationTurns', 'pvp_duration_turns'),
      pvpBuffs: field(item, 'pvpBuffs', 'pvp_buffs'),
    }]]
  }))
  return { pokemon, forms: {}, types, moves } as unknown as Masterfile
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
    pvpPower: current?.pvpPower,
    pvpEnergy: current?.pvpEnergy,
    pvpDurationTurns: current?.pvpDurationTurns,
    pvpBuffs: current?.pvpBuffs,
    metrics: current?.metrics ?? {},
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
    eliteQuick: form.eliteQuickMoves ?? pokemon.eliteQuickMoves,
    eliteCharged: form.eliteChargedMoves ?? pokemon.eliteChargedMoves,
  }

  values(formMoves.quick).forEach((move) => mergeMove(moves, move, 'FAST'))
  values(formMoves.charged).forEach((move) => mergeMove(moves, move, 'CHARGED'))
  values(formMoves.eliteQuick).forEach((move) => mergeMove(moves, move, 'FAST'))
  values(formMoves.eliteCharged).forEach((move) => mergeMove(moves, move, 'CHARGED'))

  const relations = [
    ...values(formMoves.quick).map((move) => ({ moveId: move.moveId, availability: 'NORMAL' as const })),
    ...values(formMoves.charged).map((move) => ({ moveId: move.moveId, availability: 'NORMAL' as const })),
    ...values(formMoves.eliteQuick).map((move) => ({ moveId: move.moveId, availability: 'ELITE' as const })),
    ...values(formMoves.eliteCharged).map((move) => ({ moveId: move.moveId, availability: 'ELITE' as const })),
  ]
  const uniqueRelations = new Map<number, (typeof relations)[number]>()
  relations.forEach((relation) => {
    const current = uniqueRelations.get(relation.moveId)
    if (!current || relation.availability === 'NORMAL') uniqueRelations.set(relation.moveId, relation)
  })

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
    moves: [...uniqueRelations.values()],
    evolutions: values(form.evolutions ?? (form.form === pokemon.defaultFormId ? pokemon.evolutions : undefined)),
    temporaryEvolutions: values(form.temporaryEvolutions ?? pokemon.temporaryEvolutions),
  }
}

export function normalizeMasterfile(masterfile: Masterfile): NormalizedDataset {
  if (!masterfile.pokemon || !masterfile.types || !masterfile.moves) {
    throw new Error('El archivo no contiene pokemon, types y moves')
  }

  masterfile = adaptGeneratedMasterfile(masterfile)

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
      pvpPower: move.pvpPower,
      pvpEnergy: move.pvpEnergy,
      pvpDurationTurns: move.pvpDurationTurns,
      pvpBuffs: move.pvpBuffs,
      metrics: moveMetrics(move.power, move.energy, move.duration, move.pvpPower, move.pvpEnergy),
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
      unreleased: entry.unreleased ?? false,
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

function ratio(numerator?: number, denominator?: number) {
  return numerator !== undefined && denominator ? Math.round((numerator / Math.abs(denominator)) * 1000) / 1000 : undefined
}

function moveMetrics(power?: number, energy?: number, durationMs?: number, pvpPower?: number, pvpEnergy?: number) {
  const durationSeconds = durationMs ? durationMs / 1000 : undefined
  return {
    pveDps: ratio(power, durationSeconds),
    pveEnergyPerSecond: ratio(energy, durationSeconds),
    pveDamagePerEnergy: energy !== undefined && energy < 0 ? ratio(power, energy) : undefined,
    pvpDamagePerEnergy: pvpEnergy !== undefined && pvpEnergy < 0 ? ratio(pvpPower, pvpEnergy) : undefined,
  }
}
