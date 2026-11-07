export interface Colaborador {
  id: string
  nome: string
  funcao: string
  created?: string
  updated?: string
}

export type PercentualHoraExtra = '50%' | '100%'

export interface RegistroHoraExtra {
  id: string
  colaborador: string
  data: string // YYYY-MM-DD
  hora: string // HH:mm
  quantidade_horas: number
  valor_hora: number
  percentual: PercentualHoraExtra
  valor_total: number
  observacao?: string
  created?: string
  updated?: string
  expand?: {
    colaborador?: Colaborador
  }
}

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}
