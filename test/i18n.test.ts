import { describe, expect, it } from 'vitest'
import { localizedCatalog } from '../src/static/i18n.js'

const dataset = {
  pokemon: [{ id: 1, name: 'Bulbasaur', slug: 'bulbasaur', legendary: false, mythic: false, ultraBeast: false, unreleased: false }],
  forms: [], moves: [], types: [{ id: 12, slug: 'grass', name: 'Grass' }],
}

describe('localized catalogs', () => {
  it('aplica traducciones del snapshot', () => {
    const catalog = localizedCatalog(dataset, 'es', { pokemon: { poke_1: 'Bulbasaur ES' } })
    expect(catalog.pokemon[0]).toMatchObject({ name: 'Bulbasaur ES', canonicalName: 'Bulbasaur', translated: true })
  })

  it('incluye traducción española de tipos como respaldo local', () => {
    expect(localizedCatalog(dataset, 'es-mx', {}).types[0]).toMatchObject({ name: 'Planta', canonicalName: 'Grass' })
  })
})
