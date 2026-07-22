import type { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '../database.js'
import { paginationMeta, validationError } from '../lib/http.js'
import { moveQuerySchema } from '../schemas.js'

export const moveRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    schema: { tags: ['Movimientos'], summary: 'Lista y filtra movimientos' },
  }, async (request, reply) => {
    const parsed = moveQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send(validationError(parsed.error))

    const { page, limit, q, type, category } = parsed.data
    const where: Prisma.MoveWhereInput = {
      ...(q && { name: { contains: q, mode: 'insensitive' } }),
      ...(type && { type: { slug: type } }),
      ...(category && { category }),
    }

    const [items, total] = await prisma.$transaction([
      prisma.move.findMany({
        where,
        include: { type: true },
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.move.count({ where }),
    ])

    return { data: items, meta: paginationMeta(page, limit, total) }
  })
}
