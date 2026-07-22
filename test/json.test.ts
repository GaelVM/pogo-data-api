import { describe, expect, it } from 'vitest'
import { jsonSafe } from '../src/lib/json.js'

describe('jsonSafe', () => {
  it('convierte bigint anidados sin modificar los demás valores', () => {
    expect(jsonSafe({ id: 12n, forms: [{ id: 13n, name: 'Normal' }] })).toEqual({
      id: '12',
      forms: [{ id: '13', name: 'Normal' }],
    })
  })
})
