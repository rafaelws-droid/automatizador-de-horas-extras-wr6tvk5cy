import { useEffect, useState } from 'react'
import { colaboradoresService, type ColaboradorInput } from '@/services/colaboradores'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { EMPRESAS, type Colaborador, type Empresa } from '@/types'
import { Loader2, Users, Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/exportUtils'

const badgeClasses: Record<Empresa, string> = {
  RAFAEL: 'bg-blue-100 text-blue-800 border-blue-200',
  RUANN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  OLIMAR: 'bg-purple-100 text-purple-800 border-purple-200',
}

export default function Colaboradores() {
  const { toast } = useToast()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('TODAS')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<ColaboradorInput>({
    nome: '',
    funcao: '',
    empresa: 'RAFAEL',
    valor_hora: 0,
  })

  const loadColaboradores = async () => {
    try {
      const data = await colaboradoresService.getAll()
      setColaboradores(data)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar colaboradores',
        description: 'Não foi possível buscar a lista de colaboradores.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadColaboradores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const colaboradoresFiltrados = colaboradores
    .filter((c) => c.nome.toLowerCase().includes(filtro.toLowerCase()))
    .filter((c) => filtroEmpresa === 'TODAS' || c.empresa === filtroEmpresa)

  const openCreate = () => {
    setEditingId(null)
    setForm({ nome: '', funcao: '', empresa: 'RAFAEL', valor_hora: 0 })
    setFieldErrors({})
    setIsDialogOpen(true)
  }

  const openEdit = (c: Colaborador) => {
    setEditingId(c.id)
    setForm({
      nome: c.nome,
      funcao: c.funcao,
      empresa: c.empresa,
      valor_hora: c.valor_hora ?? 0,
    })
    setFieldErrors({})
    setIsDialogOpen(true)
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.nome.trim()) errors.nome = 'Informe o nome do colaborador'
    if (!form.funcao.trim()) errors.funcao = 'Informe a função'
    if (!form.empresa) errors.empresa = 'Selecione a empresa'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    try {
      if (editingId) {
        await colaboradoresService.update(editingId, form)
        toast({
          title: 'Colaborador atualizado!',
          description: `Dados de ${form.nome} salvos com sucesso.`,
        })
      } else {
        await colaboradoresService.create(form)
        toast({
          title: 'Colaborador cadastrado!',
          description: `${form.nome} foi vinculado à empresa ${form.empresa}.`,
        })
      }
      setIsDialogOpen(false)
      loadColaboradores()
    } catch (err) {
      console.error(err)
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro ao salvar colaborador',
        description: getErrorMessage(err),
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
      await colaboradoresService.delete(deleteId)
      toast({
        title: 'Colaborador excluído!',
        description: 'O registro foi removido com sucesso.',
      })
      setDeleteId(null)
      loadColaboradores()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao excluir colaborador',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getFirstValidationError = () => {
    return fieldErrors.nome || fieldErrors.funcao || fieldErrors.empresa || null
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            Colaboradores
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cadastro com vínculo de empresa, função e valor da hora pré-definido.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Colaborador
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200">
            <Building2 className="h-4 w-4 text-slate-400 mr-1" />
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas as empresas</SelectItem>
            {EMPRESAS.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-sm">Carregando colaboradores...</p>
          </div>
        </div>
      ) : colaboradoresFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <Users className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum colaborador encontrado</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Ajuste os filtros ou cadastre um novo colaborador vinculado à sua empresa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {colaboradoresFiltrados.map((c) => (
            <Card key={c.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base text-slate-900">{c.nome}</CardTitle>
                  <Badge variant="outline" className={badgeClasses[c.empresa] || ''}>
                    {c.empresa}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{c.funcao}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Valor da hora
                    </p>
                    <p className="text-sm font-bold text-emerald-700">
                      {(c.valor_hora ?? 0) > 0 ? formatCurrency(c.valor_hora) : 'Não definido'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(c)}
                    className="flex-1 flex items-center gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(c.id)}
                    className="text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
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
            <DialogTitle>{editingId ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
                className={fieldErrors.nome ? 'border-red-300' : ''}
              />
              {fieldErrors.nome && <p className="text-xs text-red-600">{fieldErrors.nome}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="funcao">
                Função <span className="text-red-500">*</span>
              </Label>
              <Input
                id="funcao"
                value={form.funcao}
                onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                placeholder="Ex: Motorista, Operador..."
                className={fieldErrors.funcao ? 'border-red-300' : ''}
              />
              {fieldErrors.funcao && <p className="text-xs text-red-600">{fieldErrors.funcao}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>
                Empresa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.empresa}
                onValueChange={(value) => setForm({ ...form, empresa: value as Empresa })}
              >
                <SelectTrigger
                  className={`bg-white ${fieldErrors.empresa ? 'border-red-300' : ''}`}
                >
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {EMPRESAS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.empresa ? (
                <p className="text-xs text-red-600">{fieldErrors.empresa}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  Usada automaticamente nos lançamentos e relatórios.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor_hora">
                Valor da hora (R$) — pre-definido{' '}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </Label>
              <Input
                id="valor_hora"
                type="number"
                min="0"
                step="0.01"
                value={form.valor_hora ?? 0}
                onChange={(e) => setForm({ ...form, valor_hora: Number(e.target.value) })}
                placeholder="Ex: 25.00"
              />
              <p className="text-xs text-slate-500">
                Preenche automaticamente o campo &quot;Valor Normal da Hora&quot; no lançamento.
              </p>
            </div>

            {getFirstValidationError() && (
              <p className="text-xs text-red-600">{getFirstValidationError()}</p>
            )}

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

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O colaborador será removido do cadastro.
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
