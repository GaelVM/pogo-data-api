import { buildApp } from './app.js'
import { env } from './config.js'
import { prisma } from './database.js'

const app = await buildApp()

const closeGracefully = async (signal: string) => {
  app.log.info({ signal }, 'Cerrando servidor')
  await app.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => void closeGracefully('SIGINT'))
process.on('SIGTERM', () => void closeGracefully('SIGTERM'))

try {
  await app.listen({ host: env.HOST, port: env.PORT })
} catch (error) {
  app.log.error(error)
  await prisma.$disconnect()
  process.exit(1)
}
