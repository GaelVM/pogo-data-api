import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../database.js'

export const metaRoutes: FastifyPluginAsync = async (app) => {
  app.get('/version', {
    schema: { tags: ['Metadata'], summary: 'Devuelve la versión activa del dataset' },
  }, async (_request, reply) => {
    const version = await prisma.datasetVersion.findFirst({
      where: { active: true },
      orderBy: { importedAt: 'desc' },
    })

    if (!version) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Todavía no se importó un dataset',
      })
    }

    return { data: version }
  })
}
