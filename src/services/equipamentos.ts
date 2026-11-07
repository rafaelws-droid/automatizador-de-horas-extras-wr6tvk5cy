import pb from '@/lib/pocketbase/client'
import type { Equipamento } from '@/types'

export interface EquipamentoInput {
  identificacao: string
  descricao?: string
}

export const equipamentosService = {
  async getAll(): Promise<Equipamento[]> {
    const records = await pb.collection('equipamentos').getFullList<Equipamento>({
      sort: 'identificacao',
    })
    return records
  },

  async getById(id: string): Promise<Equipamento> {
    const record = await pb.collection('equipamentos').getOne<Equipamento>(id)
    return record
  },

  async create(data: EquipamentoInput): Promise<Equipamento> {
    const record = await pb.collection('equipamentos').create<Equipamento>({
      identificacao: data.identificacao.trim().toUpperCase(),
      descricao: data.descricao?.trim() || '',
    })
    return record
  },

  async update(id: string, data: EquipamentoInput): Promise<Equipamento> {
    const record = await pb.collection('equipamentos').update<Equipamento>(id, {
      identificacao: data.identificacao.trim().toUpperCase(),
      descricao: data.descricao?.trim() || '',
    })
    return record
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('equipamentos').delete(id)
    return true
  },
}
