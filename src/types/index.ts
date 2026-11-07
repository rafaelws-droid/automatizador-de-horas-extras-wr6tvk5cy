export type PercentualHoraExtra = '50%' | '100%'

export const EMPRESAS = ['RAFAEL', 'RUANN', 'OLIMAR'] as const
export type Empresa = (typeof EMPRESAS)[number]

export const LOCAIS_TRABALHO = ['BARRAGEM 03', 'PDR 03', 'KYMERA', 'OFICINA', 'RENOVA'] as const
export type LocalTrabalho = (typeof LOCAIS_TRABALHO)[number]

export interface Colaborador {
  id: string
  nome: string
  funcao: string
  empresa: Empresa
  valor_hora?: number
  created?: string
  updated?: string
}

export interface Equipamento {
  id: string
  identificacao: string
  descricao?: string
  created?: string
  updated?: string
}

export interface RegistroHoraExtra {
  id: string
  colaborador: string
  data: string // YYYY-MM-DD
  hora: string // HH:mm
  hora_fim?: string // HH:mm
  quantidade_horas: number
  valor_hora: number
  percentual: PercentualHoraExtra
  valor_total: number
  local_trabalho?: string
  equipamento?: string // id do equipamento
  observacao?: string
  created?: string
  updated?: string
  expand?: {
    colaborador?: Colaborador
    equipamento?: Equipamento
  }
}

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}
