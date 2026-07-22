import type { NormalizedDataset } from '../importer/normalize.js'
import type { SupportedLocale } from './i18n.js'
import { pokemonIdFromAsset } from './availability.js'

const typeNames: Record<string, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta', ice: 'Hielo',
  fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada',
}

const quotes: Record<string, string> = {
  'I will not tolerate your interference.': 'No toleraré tus interferencias.',
  'My strength comes from my loyalty to Team GO Rocket.': 'Mi fuerza proviene de mi lealtad al Team GO Rocket.',
  "It's time to learn your place in the world.": 'Es hora de que aprendas cuál es tu lugar en el mundo.',
  'I envy you—you get to battle me!': '¡Te envidio: tienes la oportunidad de luchar contra mí!',
  'Normal does not mean weak.': 'Que sea normal no significa que sea débil.',
  'Do you know how hot Pokémon fire breath can get?': '¿Sabes lo caliente que puede llegar a ser el aliento de fuego de un Pokémon?',
  'These waters are treacherous!': '¡Estas aguas son traicioneras!',
  'Get ready to be shocked!': '¡Prepárate para una buena descarga!',
  "Don't tangle with us!": '¡No te enredes con nosotros!',
  "You're gonna be frozen in your tracks.": 'Te vas a quedar congelado.',
  "This buff physique isn't just for show!": '¡Estos músculos no son solo de adorno!',
  'Coiled and ready to strike!': '¡Enroscados y listos para atacar!',
  "You'll be defeated into the ground!": '¡Vas a morder el polvo!',
  'Battle against my Flying-type Pokémon!': '¡Lucha contra mis Pokémon de tipo Volador!',
  'Are you scared of psychics that use unseen power?': '¿Te asustan los psíquicos que usan poderes invisibles?',
  'Go, my super bug Pokémon!': '¡Adelante, mis super-Pokémon de tipo Bicho!',
  "Let's rock and roll!": '¡Prepárate para rockanrolear!',
  'Ke...ke...ke...ke...ke...ke!': 'Je...je...je...je...je...je...',
  "ROAR! ...How'd that sound?": '¡GRRR! ¿Qué te ha parecido?',
  'Wherever there is light, there is also shadow.': 'Dondequiera que haya luz, también hay sombras.',
  "You're no match for my iron will!": '¡No eres rival para mi voluntad de hierro!',
  'Check out my cute Pokémon!': '¡Mira qué monos son mis Pokémon!',
  'Winning is for winners.': 'Ganar es para los ganadores.',
  'Fooled ya, twerp.': 'Te engañé, mocoso.',
}

function localizedGruntName(entry: Record<string, unknown>) {
  const name = String(entry.name ?? '')
  if (name === 'Male Grunt') return 'Recluta masculino'
  if (name === 'Female Grunt') return 'Recluta femenina'
  if (name === 'Decoy Female Grunt') return 'Recluta señuelo'
  const match = name.match(/^(.+)-type (Male|Female) Grunt$/)
  if (match) return `Recluta ${match[2] === 'Male' ? 'masculino' : 'femenina'} de tipo ${typeNames[String(entry.type)] ?? match[1]}`
  return name
}

export function localizedRocket(entries: unknown[], dataset: NormalizedDataset, locale: SupportedLocale, pokemonNames: Map<number, string>) {
  const canonicalNames = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon.name]))
  const localizePokemon = (raw: unknown) => {
    const pokemon = raw as Record<string, unknown>
    const pokemonId = pokemonIdFromAsset(pokemon.image)
    const canonicalSpecies = pokemonId ? canonicalNames.get(pokemonId) : undefined
    const localizedName = pokemonId ? pokemonNames.get(pokemonId) : undefined
    return { ...pokemon, pokemonId, canonicalName: pokemon.name, localizedName: localizedName ?? pokemon.name,
      name: pokemon.name === canonicalSpecies && localizedName ? localizedName : pokemon.name,
      types: Array.isArray(pokemon.types) ? pokemon.types.map((type) => locale === 'en' ? type : (typeNames[String(type)] ?? type)) : [] }
  }
  const rocket = entries.map((raw) => {
    const entry = raw as Record<string, unknown>
    const quote = String(entry.quote ?? '')
    const translated = locale !== 'en' && Boolean(quotes[quote])
    return { ...entry, name: locale === 'en' ? entry.name : localizedGruntName(entry), canonicalName: entry.name,
      title: locale === 'en' ? entry.title : entry.title === 'Team GO Rocket Boss' ? 'Jefe del Team GO Rocket' : entry.title === 'Team GO Rocket Leader' ? 'Líder del Team GO Rocket' : 'Recluta del Team GO Rocket',
      canonicalTitle: entry.title, quote: translated ? quotes[quote] : quote, canonicalQuote: quote, translated,
      localizedType: locale === 'en' ? entry.type : (typeNames[String(entry.type)] ?? entry.type),
      firstPokemon: Array.isArray(entry.firstPokemon) ? entry.firstPokemon.map(localizePokemon) : [],
      secondPokemon: Array.isArray(entry.secondPokemon) ? entry.secondPokemon.map(localizePokemon) : [],
      thirdPokemon: Array.isArray(entry.thirdPokemon) ? entry.thirdPokemon.map(localizePokemon) : [] }
  })
  return { locale, fallbackLocale: 'en', source: 'GaelVM/DataDuck', coverage: { total: rocket.length, translated: rocket.filter((entry) => entry.translated).length }, rocket }
}

