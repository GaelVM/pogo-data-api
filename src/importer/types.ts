export type Dictionary<T> = Record<string, T>

export interface MasterType {
  typeId: number
  typeName: string
}

export interface MasterMoveReference {
  moveId: number
  moveName: string
  proto?: string
  type?: number
  power?: number
  energy?: number
  duration?: number
}

export interface MasterEvolution {
  pokemon: number
  form?: number
  candyCost?: number
  item?: number
}

export interface MasterTemporaryEvolution {
  id: number
  attack?: number
  defense?: number
  stamina?: number
  height?: number
  weight?: number
  typeIds: number[]
  unreleased?: boolean
  firstEnergyCost?: number
  subsequentEnergyCost?: number
}

export interface MasterForm {
  name: string
  proto?: string
  form: number
  isCostume?: boolean
  stats?: { attack?: number; defense?: number; stamina?: number }
  types?: Dictionary<MasterType>
  quickMoves?: Dictionary<MasterMoveReference>
  chargedMoves?: Dictionary<MasterMoveReference>
  eliteQuickMoves?: Dictionary<MasterMoveReference>
  eliteChargedMoves?: Dictionary<MasterMoveReference>
  gmaxMoves?: Dictionary<MasterMoveReference>
  evolutions?: Dictionary<MasterEvolution>
  temporaryEvolutions?: Dictionary<MasterTemporaryEvolution>
  height?: number
  weight?: number
  purificationCandy?: number
  purificationDust?: number
}

export interface MasterPokemon {
  name: string
  pokedexId: number
  defaultFormId?: number
  genId?: number
  generation?: string
  family?: number
  legendary?: boolean
  mythic?: boolean
  ultraBeast?: boolean
  unreleased?: boolean
  stats?: { attack?: number; defense?: number; stamina?: number }
  types?: Dictionary<MasterType>
  forms?: Dictionary<MasterForm>
  quickMoves?: Dictionary<MasterMoveReference>
  chargedMoves?: Dictionary<MasterMoveReference>
  eliteQuickMoves?: Dictionary<MasterMoveReference>
  eliteChargedMoves?: Dictionary<MasterMoveReference>
  gmaxMoves?: Dictionary<MasterMoveReference>
  evolutions?: Dictionary<MasterEvolution>
  temporaryEvolutions?: Dictionary<MasterTemporaryEvolution>
  height?: number
  weight?: number
  purificationCandy?: number
  purificationDust?: number
  misc?: {
    buddyDistance?: number
    thirdMoveStardust?: number
    thirdMoveCandy?: number
    tradable?: boolean
    transferable?: boolean
  }
}

export interface MasterMove {
  id: number
  name: string
  proto?: string
  power?: number
  energy?: number
  duration?: number
  pvpPower?: number
  pvpEnergy?: number
  pvpDurationTurns?: number
  pvpBuffs?: unknown
  type?: number
}

export interface Masterfile {
  pokemon: Dictionary<MasterPokemon>
  forms: Dictionary<{ formId: number; formName: string; proto?: string }>
  types: Dictionary<MasterType>
  moves: Dictionary<MasterMove>
  items?: Dictionary<unknown>
  questTypes?: Dictionary<unknown>
  questConditions?: Dictionary<unknown>
  questRewardTypes?: Dictionary<unknown>
  invasions?: Dictionary<unknown>
  weather?: Dictionary<unknown>
  raids?: Dictionary<unknown>
  teams?: Dictionary<unknown>
  routeTypes?: Dictionary<unknown>
  translations?: Dictionary<unknown>
  costumes?: Dictionary<unknown>
  locationCards?: Dictionary<unknown>
}
