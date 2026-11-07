import pb from '@/lib/pocketbase/client'
import type { RegistroHoraExtra, PercentualHoraExtra } from '@/types'

export interface CreateRegistroInput {
  colaborador: string
  data: string
  hora: string
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
