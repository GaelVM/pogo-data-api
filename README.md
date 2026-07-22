# PoGo Data API

API REST propia, versionada y autocontenida para consultar datos de Pokémon GO.

La aplicación separa la actualización del dataset del servicio de consultas:

1. `data:generate` crea un snapshot local del Game Master.
2. `data:import` normaliza el snapshot y lo almacena en PostgreSQL.
3. La API consulta exclusivamente tu base de datos.

Si la fuente de actualización deja de estar disponible, la API continúa funcionando con la última versión importada.

## Incluido en la versión 0.1

- Pokémon y generaciones.
- Formas y disfraces.
- Estadísticas base.
- Tipos.
- Movimientos rápidos y cargados.
- Evoluciones.
- Búsqueda, filtros y paginación.
- Historial de versiones del dataset.
- Documentación OpenAPI/Swagger.
- PostgreSQL, Prisma y migraciones.
- Docker Compose.
- Pruebas y CI para GitHub Actions.

## Requisitos

- Node.js 22 o superior.
- PostgreSQL 16 o superior, o Docker.

## Inicio rápido con Docker

```bash
docker compose up --build -d
```

Carga el dataset pequeño de demostración:

```bash
docker compose exec api npm run data:seed
```

Abre:

- API: <http://localhost:3000>
- Swagger: <http://localhost:3000/docs>
- Estado: <http://localhost:3000/health/live>

## Desarrollo local

```bash
cp .env.example .env
npm install
docker compose up database -d
npx prisma generate
npm run db:deploy
npm run data:seed
npm run dev
```

## Generar e importar datos completos

Genera y conserva un nuevo snapshot:

```bash
npm run data:generate
```

Importa el snapshot más reciente de `data/raw`:

```bash
npm run data:import
```

También puedes importar un archivo específico compatible con el formato de Masterfile Generator:

```bash
npm run data:import -- /ruta/al/master-latest-everything.json
```

Los snapshots completos no se suben al repositorio por defecto. Esto evita inflar el historial de Git; puedes respaldarlos en almacenamiento de objetos o en una publicación versionada independiente.

## Endpoints

```http
GET /api/v1/pokemon
GET /api/v1/pokemon/:id-o-slug
GET /api/v1/moves
GET /api/v1/meta/version
GET /health/live
GET /health/ready
```

Ejemplos:

```http
GET /api/v1/pokemon?q=bulba
GET /api/v1/pokemon?generation=1&type=grass
GET /api/v1/pokemon?legendary=true&page=1&limit=25
GET /api/v1/pokemon/1
GET /api/v1/pokemon/bulbasaur
GET /api/v1/moves?category=FAST&type=grass
```

Todas las listas devuelven metadatos de paginación:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "pages": 0
  }
}
```

## Estructura

```text
src/
├── importer/       # generación, normalización e importación
├── lib/            # utilidades compartidas
├── routes/         # endpoints Fastify
├── app.ts          # construcción de la aplicación
├── config.ts       # variables de entorno validadas
├── database.ts     # cliente Prisma
└── server.ts       # proceso HTTP

prisma/
├── migrations/     # migraciones SQL versionadas
├── schema.prisma   # modelo relacional
└── seed.ts         # dataset pequeño de demostración

data/
├── raw/            # snapshots completos ignorados por Git
└── sample/         # fixture versionado para desarrollo
```

## Independencia de datos

La API no consulta servicios externos durante su funcionamiento. `pogo-data-generator` se usa solamente para crear nuevos snapshots. Si prefieres una actualización completamente manual, descarga o conserva un archivo Game Master compatible y ejecuta únicamente `data:import`.

Cada importación guarda:

- Versión.
- SHA-256 del archivo.
- Fecha de importación.
- Cantidad de Pokémon, formas y movimientos.
- Versión activa.

Importar dos veces exactamente el mismo snapshot es idempotente: la segunda ejecución se omite.

## Seguridad

Antes de publicar en producción:

- Cambia todas las contraseñas del `docker-compose.yml`.
- Limita `CORS_ORIGIN` a tus dominios.
- Coloca la API detrás de HTTPS.
- No expongas PostgreSQL públicamente.
- Conserva copias de los snapshots y de la base.

## Propiedad intelectual

Este proyecto no está afiliado con Pokémon, Nintendo, Game Freak, The Pokémon Company ni Scopely. Los nombres, personajes, datos y recursos relacionados pertenecen a sus respectivos propietarios. El código de esta API se distribuye bajo MIT; esa licencia no concede derechos sobre datos o recursos de terceros.

No se incluyen sprites ni imágenes. Debes utilizar recursos para los que tengas autorización y servirlos desde tu propia infraestructura.
