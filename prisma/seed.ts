import { resolve } from 'node:path'
import { prisma } from '../src/database.js'
import { importSnapshot } from '../src/importer/importer.js'

try {
  await importSnapshot(resolve('data/sample/game-master.sample.json'), prisma)
  console.log('Datos de ejemplo cargados')
} finally {
  await prisma.$disconnect()
}
