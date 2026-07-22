import { describe, expect, it } from 'vitest'
import { raidGuides } from '../src/static/raid-guides.js'

describe('raid guides', () => {
  it('identifica al jefe usando su recurso visual', () => {
    const dataset = {
      pokemon: [{ id: 382, name: 'Kyogre', slug: 'kyogre', legendary: true, mythic: false, ultraBeast: false, unreleased: false }],
      forms: [{ pokemonId: 382, formId: 0, slug: 'normal', name: 'Normal', isDefault: true, isCostume: false, attack: 270, defense: 228, stamina: 205, typeIds: [11], moves: [], evolutions: [], temporaryEvolutions: [] }],
      types: [{ id: 11, slug: 'water', name: 'Water' }, { id: 12, slug: 'grass', name: 'Grass' }], moves: [],
    }
    const source = { meta: {}, events: [], eggs: [], research: [], rocket: [], raids: [{ name: 'Kyogre', tier: '5-Star Raids', image: 'pm382.icon.png', types: [{ name: 'water' }] }] }
    const [guide] = raidGuides(dataset, source)
    expect(guide).toMatchObject({ pokemonId: 382, pokemonName: 'Kyogre' })
    expect(guide.weaknesses.map((type) => type.slug)).toContain('grass')
  })
})
