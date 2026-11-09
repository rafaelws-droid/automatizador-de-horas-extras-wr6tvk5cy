import { useEffect, useMemo, useState } from 'react'
import { equipamentosService, type EquipamentoInput } from '@/services/equipamentos'
import { registrosService } from '@/services/registros'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import type { Equipamento, RegistroHoraExtra } from '@/types'
import { Loader2, Wrench, Plus, Pencil, Trash2, Search, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDateBR } from '@/lib/exportUtils'
import { LoadError } from '@/components/LoadError'

export default function Equipamentos() {
  const { toast } = useToast()
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [registros, setRegistros] = useState<RegistroHoraExtra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [equipamentoHistorico, setEquipamentoHistorico] = useState<Equipamento | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<EquipamentoInput>({ identificacao: '', descricao: '' })

  const loadData = async () => {
    try {
      setIsLoading(true)
      setLoadError(false)
      const [eqs, regs] = await Promise.all([
        equipamentosService.getAll(),
        registrosService.getAll(),
      ])
      setEquipamentos(eqs)
      setRegistros(regs)
    } catch (err) {
      console.error(err)
      setLoadError(true)
      toast({
        title: 'Erro ao carregar equipamentos',
        description: 'Não foi possível buscar os dados.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Histórico de uso por equipamento (todas as coleções já carregadas em memória)
  const historicoPorEquipamento = useMemo(() => {
    const mapa: Record<string, RegistroHoraExtra[]> = {}
    for (const reg of registros) {
      if (!reg.equipamento) continue
      if (!mapa[reg.equipamento]) mapa[reg.equipamento] = []
      mapa[reg.equipamento].push(reg)
    }
    for (const key of Object.keys(mapa)) {
      mapa[key].sort((a, b) => b.data.localeCompare(a.data))
    }
    return mapa
  }, [registros])

  const usoPorEquipamento = useMemo(() => {
    const contagem: Record<string, number> = {}
    for (const [eqId, regs] of Object.entries(historicoPorEquipamento)) {
      contagem[eqId] = regs.length
    }
    return contagem
  }, [historicoPorEquipamento])

  const equipamentosFiltrados = equipamentos.filter(
    (e) =>
      e.identificacao.toLowerCase().includes(filtro.toLowerCase()) ||
      (e.descricao || '').toLowerCase().includes(filtro.toLowerCase()),
  )

  const openCreate = () => {
    setEditingId(null)
    setForm({ identificacao: '', descricao: '' })
    setFieldErrors({})
    setIsDialogOpen(true)
  }

  const openEdit = (eq: Equipamento) => {
    setEditingId(eq.id)
    setForm({ identificacao: eq.identificacao, descricao: eq.descricao || '' })
    setFieldErrors({})
    setIsDialogOpen(true)
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.identificacao.trim()) errors.identificacao = 'Informe a identificação (ex: ST15)'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    try {
      if (editingId) {
        await equipamentosService.update(editingId, form)
        toast({
          title: 'Equipamento atualizado!',
          description: `Dados de ${form.identificacao} salvos com sucesso.`,
        })
      } else {
        await equipamentosService.create(form)
        toast({
          title: 'Equipamento cadastrado!',
          description: `${form.identificacao} já pode ser usado nos lançamentos.`,
        })
      }
      setIsDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      setFieldErrors(extractFieldErrors(err))
      const msg = getErrorMessage(err)
      toast({
        title: 'Erro ao salvar equipamento',
        description:
          msg.includes('identificacao') || msg.includes('unique')
            ? 'Já existe um equipamento com essa identificação.'
            : msg,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await equipamentosService.delete(deleteId)
      toast({
        title: 'Equipamento excluído!',
        description: 'O registro foi removido com sucesso.',
      })
      setDeleteId(null)
      loadData()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao excluir equipamento',
        description: 'Não foi possível excluir. Ele pode estar vinculado a lançamentos existentes.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const registrosDoHistorico = equipamentoHistorico
    ? historicoPorEquipamento[equipamentoHistorico.id] || []
    : []

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="h-7 w-7 text-blue-600" />
            Equipamentos
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cadastro de equipamentos/veículos e histórico de uso nos lançamentos.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Equipamento
        </Button>
      </div>

      {/* Filtro */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por identificação ou descrição..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="pl-9 bg-white border-slate-200"
        />
      </div>

      {/* Lista */}
      {loadError ? (
        <LoadError
          onRetry={loadData}
          title="Erro ao carregar equipamentos"
          message="Não foi possível buscar os equipamentos. Verifique sua conexão e tente novamente."
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-sm">Carregando equipamentos...</p>
          </div>
        </div>
      ) : equipamentosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <Wrench className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum equipamento encontrado</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Cadastre equipamentos/veículos (ST15, ST17, ST27...) para usá-los nos lançamentos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipamentosFiltrados.map((eq) => (
            <Card key={eq.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base text-slate-900 font-mono">
                    {eq.identificacao}
                  </CardTitle>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                    {usoPorEquipamento[eq.id] || 0} lançamento
                    {(usoPorEquipamento[eq.id] || 0) === 1 ? '' : 's'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{eq.descricao || 'Sem descrição'}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEquipamentoHistorico(eq)}
                    className="flex-1 flex items-center gap-1.5"
                  >
                    <History className="h-3.5 w-3.5" />
                    Histórico
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(eq)}
                    className="flex items-center gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(eq.id)}
                    className="text-red-600 hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Equipamento' : 'Novo Equipamento/Veículo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identificacao">
                Identificação <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identificacao"
                value={form.identificacao}
                onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
                placeholder="Ex: ST15, ST17, ST27"
                className={`font-mono ${fieldErrors.identificacao ? 'border-red-300' : ''}`}
              />
              {fieldErrors.identificacao && (
                <p className="text-xs text-red-600">{fieldErrors.identificacao}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">
                Descrição / Tipo <span className="text-slate-400 font-normal">(opcional)</span>
              </Label>
              <Input
                id="descricao"
                value={form.descricao || ''}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Caminhão pipa, Escavadeira..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Salvar alterações' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de histórico de uso */}
      <Dialog
        open={!!equipamentoHistorico}
        onOpenChange={(open) => !open && setEquipamentoHistorico(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Histórico de {equipamentoHistorico?.identificacao}
            </DialogTitle>
          </DialogHeader>
          {registrosDoHistorico.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              Este equipamento ainda não foi usado em nenhum lançamento.
            </p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-2.5 px-2">Data</th>
                    <th className="py-2.5 px-2">Colaborador</th>
                    <th className="py-2.5 px-2">Empresa</th>
                    <th className="py-2.5 px-2">Local</th>
                    <th className="py-2.5 px-2 text-center">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrosDoHistorico.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-2 whitespace-nowrap">{formatDateBR(reg.data)}</td>
                      <td className="py-2 px-2">{reg.expand?.colaborador?.nome || '-'}</td>
                      <td className="py-2 px-2">{reg.expand?.colaborador?.empresa || '-'}</td>
                      <td className="py-2 px-2">{reg.local_trabalho || '-'}</td>
                      <td className="py-2 px-2 text-center font-semibold">
                        {reg.quantidade_horas} h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O equipamento será removido do cadastro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
