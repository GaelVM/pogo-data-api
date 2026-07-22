import { describe, expect, it } from 'vitest'
import { pokemonQuerySchema } from '../src/schemas.js'

describe('pokemonQuerySchema', () => {
  it('aplica paginación predeterminada y convierte filtros', () => {
    const query = pokemonQuerySchema.parse({ generation: '1', legendary: 'false' })
    expect(query).toEqual({ page: 1, limit: 25, generation: 1, legendary: false })
  })

  it('rechaza límites excesivos', () => {
    expect(pokemonQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
  })
})
