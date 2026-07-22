import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export const pokemonQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  generation: z.coerce.number().int().min(1).max(20).optional(),
  type: z.string().trim().min(1).max(40).toLowerCase().optional(),
  legendary: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
})

export const moveQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  type: z.string().trim().min(1).max(40).toLowerCase().optional(),
  category: z.enum(['FAST', 'CHARGED', 'UNKNOWN']).optional(),
})

export type PokemonQuery = z.infer<typeof pokemonQuerySchema>
export type MoveQuery = z.infer<typeof moveQuerySchema>
