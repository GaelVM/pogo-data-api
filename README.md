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
| `/v1/type-effectiveness.json` | Matriz completa de efectividad y multiplicadores |
| `/v1/moves.json` | Movimientos, estadísticas PvE/PvP, buffs y métricas derivadas |
| `/v1/forms.json` | Formas y disfraces |
| `/v1/evolutions.json` | Relaciones de evolución |
| `/v1/families.json` | Familias completas y sus rutas evolutivas |
| `/v1/combat.json` | Estadísticas derivadas y CP máximo por cada forma |
| `/v1/rankings.json` | Top 100 por ataque, defensa, stamina, bulk, producto estadístico y CP |
| `/v1/temporary-evolutions.json` | Megaevoluciones y otras evoluciones temporales |
| `/v1/items.json` | Objetos y requisitos de nivel |
| `/v1/weather.json` | Climas y tipos potenciados |
| `/v1/invasions.json` | Catálogo de invasiones del Team GO Rocket |
| `/v1/raids.json` | Niveles de incursión |
| `/v1/quest-types.json` | Tipos de misión |
| `/v1/quest-conditions.json` | Condiciones de misión |
| `/v1/quest-reward-types.json` | Tipos de recompensa |
| `/v1/teams.json` | Equipos del juego |
| `/v1/route-types.json` | Tipos de ruta |
| `/v1/translations.json` | Manifiesto de idiomas disponibles |
| `/v1/translations/es.json` | Traducciones en español |
| `/v1/translations/es-mx.json` | Traducciones en español latinoamericano |
| `/v1/translations/en.json` | Traducciones en inglés |
| `/v1/costumes.json` | Disfraces y restricciones de evolución |
| `/v1/location-cards.json` | Tarjetas de ubicación y recursos visuales asociados |
| `/v1/gigantamax.json` | Pokémon y movimientos Gigamax disponibles en el Game Master |
| `/v1/explorer.json` | Índice compacto para interfaces y exploradores visuales |
| `/v1/sprites.json` | Sprites normales y shiny de PokeMiners, con respaldo de PokéAPI |
| `/v1/pvp-rankings.json` | Rankings analíticos para Liga Super, Ultra y Master |
| `/v1/pvp-movesets.json` | Recomendaciones PvP de movimiento rápido y movimientos cargados |
| `/v1/live/events/active.json` | Eventos actualmente activos |
| `/v1/live/events/upcoming.json` | Próximos eventos |
| `/v1/live/active-raids.json` | Jefes de incursión activos |
| `/v1/live/calendar.json` | Calendario combinado de eventos e incursiones |
| `/v1/live/raid-bosses.json` | Rotación actual de incursiones importada desde DataDuck |
| `/v1/live/eggs.json` | Pools de huevos importados desde DataDuck |
| `/v1/live/research.json` | Investigaciones actuales importadas desde DataDuck |
| `/v1/live/rocket.json` | Equipos del Team GO Rocket importados desde DataDuck |
| `/v1/availability.json` | Disponibilidad unificada de todos los Pokémon |
| `/v1/pokemon/{id}/availability.json` | Disponibilidad individual por número de Pokédex |
| `/v1/indexes/by-availability/{source}.json` | Índices para raids, eggs, research, rocket y events |
| `/v1/search.json` | Índice global para buscadores y autocompletado |

### Datos dinámicos propios

Edita `data/curated/events.json` y `data/curated/raid-bosses.json` directamente desde GitHub. Usa fechas ISO 8601 con zona horaria, por ejemplo `2026-07-22T18:00:00-05:00`. Cada ejecución de GitHub Actions valida las fechas y vuelve a clasificar automáticamente los registros como `active`, `upcoming` o `past`.

GitHub Actions también ejecuta `npm run data:dataduck` para importar automáticamente la rama `data` de `GaelVM/DataDuck`. DataDuck actúa como recolector; esta API conserva rutas y esquemas de publicación estables.

Las traducciones se publican aparte para que cada cliente descargue únicamente el idioma que necesita. Sus claves cubren Pokémon, formas, movimientos, objetos, tipos, clima, misiones y textos diversos del juego.

Las formas incluyen `purificationCandy` y `purificationDust` cuando esos costes existen. Sus movimientos distinguen disponibilidad `NORMAL`, `ELITE` y `GMAX`.
| `/v1/indexes/by-type/grass.json` | Índice precomputado por tipo |
| `/v1/indexes/by-generation/1.json` | Índice precomputado por generación |
| `/v1/meta.json` | Versión, fecha, fuente y cantidades |

Cada forma dentro de la Pokédex incluye `typeMatchups.weaknesses` y `typeMatchups.resistances`. Los multiplicadores contemplan automáticamente combinaciones de dos tipos.

Los movimientos relacionados con cada forma indican `availability: "NORMAL"` o `availability: "ELITE"`. Las métricas derivadas incluyen DPS y energía por segundo en PvE, además de daño por energía cuando corresponde.

`combat.maxCp` usa IV perfectos (15/15/15) y los multiplicadores de nivel 40 y 50. `rankings.json` compara formas predeterminadas sin disfraces; no debe confundirse con rankings PvP por liga.

Los índices incluyen `/v1/indexes/by-rarity/{legendary,mythic,ultra-beast}.json` y `/v1/indexes/by-status/{released,unreleased}.json`.

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
