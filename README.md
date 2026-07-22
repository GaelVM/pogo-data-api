# PoGo Data API

API JSON estática, propia y versionada de datos de Pokémon GO. Se genera y publica únicamente con GitHub Actions y GitHub Pages: no necesita Docker, PostgreSQL, Vercel ni un servidor encendido.

## Endpoints

Cuando GitHub Pages esté habilitado, la URL base será:

```text
https://gaelvm.github.io/pogo-data-api
```

| Archivo | Contenido |
| --- | --- |
| `/v1/pokedex.json` | Pokédex completa, formas, tipos y movimientos relacionados |
| `/v1/pokemon/1.json` | Documento individual por número de Pokédex |
| `/v1/types.json` | Tipos |
| `/v1/moves.json` | Movimientos |
| `/v1/forms.json` | Formas y disfraces |
| `/v1/evolutions.json` | Relaciones de evolución |
| `/v1/indexes/by-type/grass.json` | Índice precomputado por tipo |
| `/v1/indexes/by-generation/1.json` | Índice precomputado por generación |
| `/v1/meta.json` | Versión, fecha, fuente y cantidades |

La raíz del sitio contiene una documentación navegable.

## Publicar sin instalar nada

1. Abre **Settings → Pages** en este repositorio.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**.
3. Abre **Actions → Deploy static API to GitHub Pages**.
4. Pulsa **Run workflow**.

El workflow construye `public/`, ejecuta las pruebas y publica el resultado. También se ejecuta automáticamente cada 12 horas. Si una actualización falla, GitHub Pages conserva el último despliegue correcto.

## Datos completos

Los pushes normales usan el fixture pequeño de `data/sample/` para que cada cambio sea comprobable y rápido. Las ejecuciones programadas y manuales descargan primero el Game Master completo mediante `pogo-data-generator` y luego construyen los JSON.

Los datos se normalizan antes de publicarse. Una aplicación cliente nunca consulta la fuente original: consume exclusivamente los archivos alojados en este repositorio.

## Desarrollo opcional

No es necesario para usar GitHub Pages, pero el proyecto también puede comprobarse localmente:

```bash
npm ci
npm run static:build
npm test
```

La salida se crea en `public/`.

## Versionado

Los endpoints viven bajo `/v1/`. Los campos actuales pueden ampliarse sin cambiar esa ruta; cualquier cambio incompatible deberá publicarse bajo `/v2/` para no romper consumidores existentes.

## Aviso

Proyecto no afiliado con Pokémon, Nintendo, Game Freak, The Pokémon Company ni Scopely. Los nombres, personajes y datos relacionados pertenecen a sus respectivos propietarios. La licencia MIT cubre el código del proyecto, no los recursos de terceros.
