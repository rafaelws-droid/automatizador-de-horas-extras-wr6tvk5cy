import pb from '@/lib/pocketbase/client'
import type { RegistroHoraExtra, PercentualHoraExtra } from '@/types'

export interface CreateRegistroInput {
  colaborador: string
  data: string
  hora: string
  hora_fim?: string
  quantidade_horas: number
  valor_hora: number
  percentual: PercentualHoraExtra
  observacao?: string
}

export function calcularValorTotalHoraExtra(
  quantidadeHoras: number,
  valorHora: number,
  percentual: PercentualHoraExtra,
): number {
  const fator = percentual === '100%' ? 2.0 : 1.5
  const total = Number((quantidadeHoras * valorHora * fator).toFixed(2))
  return total
}

/**
 * Calcula a quantidade de horas entre dois horários (HH:mm),
 * tratando viradas de meia-noite: 22:00 -> 02:00 = 4h.
 */
export function calcularQuantidadeHoras(horaInicio: string, horaFim: string): number {
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFim.split(':').map(Number)
  if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return 0

  const minutosInicio = h1 * 60 + m1
  const minutosFim = h2 * 60 + m2
  let minutos = minutosFim - minutosInicio
  if (minutos < 0) minutos += 24 * 60
  return Number((minutos / 60).toFixed(2))
}

export const registrosService = {
  async getAll(filter?: string): Promise<RegistroHoraExtra[]> {
    const records = await pb.collection('registros_horas').getFullList<RegistroHoraExtra>({
      sort: '-data,-created',
      expand: 'colaborador',
      filter: filter || '',
    })
    return records
  },

  async getRecent(limit = 5): Promise<RegistroHoraExtra[]> {
    const result = await pb.collection('registros_horas').getList<RegistroHoraExtra>(1, limit, {
      sort: '-data,-created',
      expand: 'colaborador',
    })
    return result.items
  },

  async create(data: CreateRegistroInput): Promise<RegistroHoraExtra> {
    const valor_total = calcularValorTotalHoraExtra(
      data.quantidade_horas,
      data.valor_hora,
      data.percentual,
    )

    const record = await pb.collection('registros_horas').create<RegistroHoraExtra>(
      {
        colaborador: data.colaborador,
        data: data.data,
        hora: data.hora,
        hora_fim: data.hora_fim || '',
        quantidade_horas: data.quantidade_horas,
        valor_hora: data.valor_hora,
        percentual: data.percentual,
        valor_total,
        observacao: data.observacao ? data.observacao.trim() : '',
      },
      {
        expand: 'colaborador',
      },
    )

    return record
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('registros_horas').delete(id)
    return true
  },
}
