import type { NormalizedDataset } from '../importer/normalize.js'
import type { DataDuckSnapshot } from './dataduck.js'
import type { LiveEvent } from './live.js'

type LooseRecord = Record<string, unknown>

function record(value: unknown): LooseRecord {
  return value !== null && typeof value === 'object' ? value as LooseRecord : {}
}

export function pokemonIdFromAsset(value: unknown) {
  if (typeof value !== 'string') return undefined
  const match = value.match(/(?:pokemon_icon_|pm)(\d{1,4})(?:\D|$)/i)
  return match ? Number(match[1]) : undefined
}

function occurrences(entries: unknown[], nestedKeys: string[] = []) {
  const result: Array<{ pokemonId: number; data: unknown }> = []
  const add = (value: unknown, parent: unknown) => {
    const item = record(value)
    const pokemonId = pokemonIdFromAsset(item.image)
    if (pokemonId) result.push({ pokemonId, data: parent })
  }
  for (const entry of entries) {
    const item = record(entry)
    const directId = pokemonIdFromAsset(item.image)
    if (directId) result.push({ pokemonId: directId, data: entry })
    for (const key of nestedKeys) {
      const nested = item[key]
      if (Array.isArray(nested)) nested.forEach((value) => add(value, entry))
    }
  }
  return result
}

function group(entries: Array<{ pokemonId: number; data: unknown }>) {
  const grouped = new Map<number, unknown[]>()
  for (const entry of entries) {
    const values = grouped.get(entry.pokemonId) ?? []
    if (!values.includes(entry.data)) values.push(entry.data)
    grouped.set(entry.pokemonId, values)
  }
  return grouped
}

export function availabilityDataset(dataset: NormalizedDataset, dataDuck: DataDuckSnapshot | undefined, events: LiveEvent[]) {
  const source = dataDuck ?? { meta: {}, events: [], raids: [], eggs: [], research: [], rocket: [] }
  const raids = group(occurrences(source.raids))
  const eggs = group(occurrences(source.eggs))
  const research = group(occurrences(source.research, ['rewards']))
  const rocket = group(occurrences(source.rocket, ['firstPokemon', 'secondPokemon', 'thirdPokemon']))
  const eventMatches = new Map<number, LiveEvent[]>()
  for (const pokemon of dataset.pokemon) {
    const name = pokemon.name.toLocaleLowerCase('en')
    eventMatches.set(pokemon.id, events.filter((event) => event.name.toLocaleLowerCase('en').includes(name)))
  }
  return dataset.pokemon.map((pokemon) => {
    const availability = {
      raids: raids.get(pokemon.id) ?? [], eggs: eggs.get(pokemon.id) ?? [],
      research: research.get(pokemon.id) ?? [], rocket: rocket.get(pokemon.id) ?? [],
      events: eventMatches.get(pokemon.id) ?? [],
    }
    const sources = Object.entries(availability).filter(([, values]) => values.length).map(([key]) => key)
    return { pokemonId: pokemon.id, pokemonName: pokemon.name, pokemonSlug: pokemon.slug, available: sources.length > 0, sources, availability }
  })
}

export function globalSearch(dataset: NormalizedDataset, availability: ReturnType<typeof availabilityDataset>) {
  const formsByPokemon = new Map<number, NormalizedDataset['forms']>()
  dataset.forms.forEach((form) => formsByPokemon.set(form.pokemonId, [...(formsByPokemon.get(form.pokemonId) ?? []), form]))
  return dataset.pokemon.map((pokemon) => {
    const status = availability.find((entry) => entry.pokemonId === pokemon.id)!
    const forms = formsByPokemon.get(pokemon.id) ?? []
    return {
      id: pokemon.id, name: pokemon.name, slug: pokemon.slug, generation: pokemon.generation,
      typeIds: [...new Set(forms.flatMap((form) => form.typeIds))],
      formNames: forms.map((form) => form.name),
      legendary: pokemon.legendary, mythic: pokemon.mythic, ultraBeast: pokemon.ultraBeast,
      availability: { available: status.available, sources: status.sources },
      urls: { pokemon: `pokemon/${pokemon.id}.json`, availability: `pokemon/${pokemon.id}/availability.json` },
    }
  })
}

