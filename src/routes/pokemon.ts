import type { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '../database.js'
import { paginationMeta, validationError } from '../lib/http.js'
import { pokemonQuerySchema } from '../schemas.js'

const formInclude = {
  types: { include: { type: true }, orderBy: { slot: 'asc' as const } },
  moves: {
    include: { move: { include: { type: true } } },
    orderBy: { moveId: 'asc' as const },
  },
  evolvesTo: {
    include: { toForm: { include: { pokemon: true } } },
  },
} satisfies Prisma.PokemonFormInclude

export const pokemonRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    schema: {
      tags: ['Pokémon'],
      summary: 'Lista Pokémon con búsqueda y filtros',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          q: { type: 'string' },
          generation: { type: 'integer' },
          type: { type: 'string' },
          legendary: { type: 'string', enum: ['true', 'false'] },
        },
      },
    },
  }, async (request, reply) => {
    const parsed = pokemonQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send(validationError(parsed.error))

    const { page, limit, q, generation, type, legendary } = parsed.data
    const where: Prisma.PokemonWhereInput = {
      ...(q && { name: { contains: q, mode: 'insensitive' } }),
      ...(generation && { generation }),
      ...(legendary !== undefined && { legendary }),
      ...(type && {
        forms: { some: { types: { some: { type: { slug: type } } } } },
      }),
    }

    const [items, total] = await prisma.$transaction([
      prisma.pokemon.findMany({
        where,
        include: {
          forms: {
            where: { isDefault: true },
            include: { types: { include: { type: true }, orderBy: { slot: 'asc' } } },
          },
        },
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pokemon.count({ where }),
    ])

    return { data: items, meta: paginationMeta(page, limit, total) }
  })

  app.get('/:identifier', {
    schema: {
      tags: ['Pokémon'],
      summary: 'Obtiene un Pokémon por número o slug',
      params: {
        type: 'object',
        required: ['identifier'],
        properties: { identifier: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { identifier } = request.params as { identifier: string }
    const numericId = Number(identifier)
    const pokemon = await prisma.pokemon.findFirst({
      where: Number.isInteger(numericId) ? { id: numericId } : { slug: identifier.toLowerCase() },
      include: { forms: { include: formInclude, orderBy: [{ isDefault: 'desc' }, { formId: 'asc' }] } },
    })

    if (!pokemon) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Pokémon no encontrado',
      })
    }

    return { data: pokemon }
  })
}
