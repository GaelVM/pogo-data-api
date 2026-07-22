import { describe, expect, it } from 'vitest'
import { localizedRocket } from '../src/static/rocket-i18n.js'

describe('Rocket localization', () => {
  it('traduce frases, títulos y nombres de reclutas', () => {
    const dataset = { pokemon: [], forms: [], types: [], moves: [] }
    const result = localizedRocket([{ name: 'Water-type Female Grunt', title: 'Team GO Rocket Grunt', type: 'water', quote: 'These waters are treacherous!' }], dataset, 'es', new Map())
    expect(result.rocket[0]).toMatchObject({ name: 'Recluta femenina de tipo Agua', title: 'Recluta del Team GO Rocket', quote: '¡Estas aguas son traicioneras!', translated: true })
  })
})
