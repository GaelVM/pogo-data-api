import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config.js'
import { healthRoutes } from './routes/health.js'
import { jsonSafe } from './lib/json.js'
import { metaRoutes } from './routes/meta.js'
import { moveRoutes } from './routes/moves.js'
import { pokemonRoutes } from './routes/pokemon.js'

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: env.LOG_LEVEL },
  })

  await app.register(helmet)
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((value) => value.trim()),
  })
  await app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: '1 minute' })
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'PoGo Data API',
        description: 'API propia y versionada de datos de Pokémon GO',
        version: '0.1.0',
      },
      servers: [{ url: '/api/v1' }],
    },
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  app.addHook('preSerialization', async (_request, _reply, payload) => jsonSafe(payload))

  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(metaRoutes, { prefix: '/api/v1/meta' })
  await app.register(pokemonRoutes, { prefix: '/api/v1/pokemon' })
  await app.register(moveRoutes, { prefix: '/api/v1/moves' })

  app.get('/', async () => ({
    name: 'PoGo Data API',
    version: '0.1.0',
    documentation: '/docs',
  }))

  return app
}
