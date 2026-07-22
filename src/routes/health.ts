import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../database.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/live', {
    schema: { tags: ['Health'], summary: 'Comprueba que el proceso está vivo' },
  }, async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  app.get('/ready', {
    schema: { tags: ['Health'], summary: 'Comprueba la conexión con PostgreSQL' },
  }, async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'ready', database: 'connected' }
    } catch {
      return reply.code(503).send({ status: 'not_ready', database: 'disconnected' })
    }
  })
}
