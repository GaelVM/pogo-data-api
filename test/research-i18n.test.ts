import { describe, expect, it } from 'vitest'
import { localizedResearch, translateResearchText } from '../src/static/research-i18n.js'

describe('research localization', () => {
  it('traduce tareas parametrizadas', () => {
    expect(translateResearchText('Catch 10 Water-type Pokémon', 'es').text).toBe('Captura 10 Pokémon de tipo Agua')
    expect(translateResearchText('Make 3 Excellent Throws in a row', 'es').text).toBe('Realiza 3 lanzamientos Excelentes seguidos')
  })

  it('relaciona recompensas con Pokédex ID', () => {
    const dataset = { pokemon: [{ id: 1, name: 'Bulbasaur', slug: 'bulbasaur', legendary: false, mythic: false, ultraBeast: false, unreleased: false }], forms: [], types: [], moves: [] }
    const result = localizedResearch([{ text: 'Catch 10 Pokémon', rewards: [{ name: 'Bulbasaur', image: 'pm1.icon.png' }] }], dataset, 'es', new Map([[1, 'Bulbasaur']]))
    expect(result.research[0]?.rewards[0]).toMatchObject({ pokemonId: 1, canonicalName: 'Bulbasaur' })
  })
})
