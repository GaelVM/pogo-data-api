import { describe, expect, it } from 'vitest'
import { localizedCalendar, translateCalendarText } from '../src/static/calendar-i18n.js'


describe('calendar localization', () => {
  it('translates common Pokémon GO event names', () => {
    expect(translateCalendarText('Pikachu Spotlight Hour', 'es').text).toBe('Hora destacada de Pikachu')
    expect(translateCalendarText('Mewtwo in 5-star Raid Battles', 'es').text).toBe('Mewtwo en incursiones de 5 estrellas')
    expect(translateCalendarText('Mega Lucario in Mega Raids', 'es').text).toBe('Mega-Lucario en megaincursiones')
  })

  it('translates nested bonuses, tasks and rewards while preserving canonical text', () => {
    const [event] = localizedCalendar([{
      id: 'sobble-community-day',
      name: 'Sobble Community Day',
      description: 'Special Research',
      bonuses: ['3x Catch Stardust'],
      extraData: {
        spotlight: { bonus: '2x Catch Candy' },
        communityday: {
          bonuses: [{ text: '3-hour Incense' }],
          specialresearch: [{
            tasks: [{ text: 'Catch 10 Pokémon', reward: { text: 'Incense' } }],
          }],
        },
      },
    }], 'es')

    expect(event.name).toBe('Día de la Comunidad de Sobble')
    expect(event.canonicalName).toBe('Sobble Community Day')
    expect(event.description).toBe('investigación especial')
    expect(event.bonuses).toEqual(['3× Polvo Estelar por captura'])
    expect(event.extraData).toMatchObject({
      spotlight: { bonus: '2× Caramelos por captura' },
      communityday: {
        bonuses: [{ text: 'Incienso de 3 horas' }],
        specialresearch: [{
          tasks: [{ text: 'Captura 10 Pokémon', reward: { text: 'Incienso' } }],
        }],
      },
    })
    expect(event.translated).toBe(true)
  })

  it('keeps unknown text as an English fallback', () => {
    const [event] = localizedCalendar([{ name: 'A brand-new event name' }], 'es')
    expect(event.name).toBe('A brand-new event name')
    expect(event.canonicalName).toBe('A brand-new event name')
    expect(event.fallbackLocale).toBe('en')
  })
})