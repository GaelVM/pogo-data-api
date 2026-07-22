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

export interface MasterForm {
  name: string
  proto?: string
  form: number
  isCostume?: boolean
  stats?: { attack?: number; defense?: number; stamina?: number }
  types?: Dictionary<MasterType>
  quickMoves?: Dictionary<MasterMoveReference>
  chargedMoves?: Dictionary<MasterMoveReference>
  evolutions?: Dictionary<MasterEvolution>
  height?: number
  weight?: number
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
  stats?: { attack?: number; defense?: number; stamina?: number }
  types?: Dictionary<MasterType>
  forms?: Dictionary<MasterForm>
  quickMoves?: Dictionary<MasterMoveReference>
  chargedMoves?: Dictionary<MasterMoveReference>
  evolutions?: Dictionary<MasterEvolution>
  height?: number
  weight?: number
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
  type?: number
}

export interface Masterfile {
  pokemon: Dictionary<MasterPokemon>
  forms: Dictionary<{ formId: number; formName: string; proto?: string }>
  types: Dictionary<MasterType>
  moves: Dictionary<MasterMove>
}
