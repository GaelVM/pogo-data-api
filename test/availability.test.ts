import { describe, expect, it } from 'vitest'
import { availabilityDataset, pokemonIdFromAsset } from '../src/static/availability.js'

describe('availability', () => {
  it('extrae Pokédex ID de recursos pm y pokemon_icon', () => {
    expect(pokemonIdFromAsset('https://cdn.test/pm382.icon.png')).toBe(382)
    expect(pokemonIdFromAsset('pokemon_icon_094_00_11.png')).toBe(94)
  })

  it('relaciona recompensas anidadas con el Pokémon', () => {
    const dataset = { pokemon: [{ id: 1, name: 'Bulbasaur', slug: 'bulbasaur', legendary: false, mythic: false, ultraBeast: false, unreleased: false }], forms: [], types: [], moves: [] }
    const dataDuck = { meta: {}, events: [], raids: [], eggs: [], rocket: [], research: [{ text: 'Catch', rewards: [{ name: 'Bulbasaur', image: 'pm1.icon.png' }] }] }
    const [entry] = availabilityDataset(dataset, dataDuck, [])
    expect(entry.sources).toEqual(['research'])
    expect(entry.availability.research).toHaveLength(1)
  })
})
