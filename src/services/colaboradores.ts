import pb from '@/lib/pocketbase/client'
import type { Colaborador, Empresa } from '@/types'

export interface ColaboradorInput {
  nome: string
  funcao: string
  empresa: Empresa
  valor_hora?: number
}

export const colaboradoresService = {
  async getAll(): Promise<Colaborador[]> {
    const records = await pb.collection('colaboradores').getFullList<Colaborador>({
      sort: 'nome',
    })
    return records
  },

  async getById(id: string): Promise<Colaborador> {
    const record = await pb.collection('colaboradores').getOne<Colaborador>(id)
    return record
  },

  async create(data: ColaboradorInput): Promise<Colaborador> {
    const record = await pb.collection('colaboradores').create<Colaborador>({
      nome: data.nome.trim(),
      funcao: data.funcao.trim(),
      empresa: data.empresa,
      valor_hora: data.valor_hora ?? 0,
    })
    return record
  },

  async update(id: string, data: ColaboradorInput): Promise<Colaborador> {
    const record = await pb.collection('colaboradores').update<Colaborador>(id, {
      nome: data.nome.trim(),
      funcao: data.funcao.trim(),
      empresa: data.empresa,
      valor_hora: data.valor_hora ?? 0,
    })
    return record
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('colaboradores').delete(id)
    return true
  },
}
