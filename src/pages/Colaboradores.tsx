import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { colaboradoresService } from '@/services/colaboradores'
import type { Colaborador } from '@/types'
import { formatCurrency } from '@/lib/exportUtils'
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'

export default function Colaboradores() {
  const { toast } = useToast()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dialog State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null)
  const [nome, setNome] = useState('')
  const [funcao, setFuncao] = useState('')
  const [valorHora, setValorHora] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  // Delete Dialog State
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const loadColaboradores = async () => {
    try {
      setIsLoading(true)
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
  }, [])

  const handleOpenCreateModal = () => {
    setEditingColaborador(null)
    setNome('')
    setFuncao('')
    setValorHora('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (c: Colaborador) => {
    setEditingColaborador(c)
    setNome(c.nome)
    setFuncao(c.funcao)
    setValorHora(c.valor_hora && c.valor_hora > 0 ? c.valor_hora.toFixed(2) : '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !funcao.trim()) {
      setFormError('Preencha o nome e a função do colaborador.')
      return
    }

    const valorHoraNum = parseFloat(valorHora.replace(',', '.')) || 0
    if (valorHoraNum < 0) {
      setFormError('O valor da hora não pode ser negativo.')
      return
    }

    try {
      setIsSaving(true)
      setFormError(null)

      if (editingColaborador) {
        await colaboradoresService.update(editingColaborador.id, {
          nome,
          funcao,
          valor_hora: valorHoraNum,
        })
        toast({
          title: 'Colaborador atualizado',
          description: `Os dados de ${nome} foram atualizados com sucesso.`,
        })
      } else {
        await colaboradoresService.create({ nome, funcao, valor_hora: valorHoraNum })
        toast({
          title: 'Colaborador cadastrado',
          description: `${nome} foi adicionado à equipe com sucesso.`,
        })
      }

      setIsModalOpen(false)
      await loadColaboradores()
    } catch (err) {
      console.error(err)
      setFormError('Erro ao salvar colaborador. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setIsDeleting(true)
      await colaboradoresService.delete(deletingId)
      toast({
        title: 'Colaborador removido',
        description: 'O colaborador foi excluído do sistema.',
      })
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
      await loadColaboradores()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível excluir o colaborador.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = colaboradores.filter((c) => {
    const term = searchTerm.toLowerCase()
    return c.nome.toLowerCase().includes(term) || c.funcao.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            Colaboradores
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cadastre, edite e gerencie os membros da equipe para apontamento de horas extras.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Novo Colaborador
        </Button>
      </div>

      {/* Search and Stats bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por nome ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium self-start sm:self-center">
              Total de colaboradores:{' '}
              <span className="font-semibold text-slate-800">{filtered.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List / Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-sm">Carregando lista de colaboradores...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <Users className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum colaborador encontrado</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
            {searchTerm
              ? 'Nenhum resultado corresponde à sua busca. Tente outros termos.'
              : 'Cadastre o primeiro colaborador para começar a registrar horas extras.'}
          </p>
          {searchTerm ? (
            <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
              Limpar busca
            </Button>
          ) : (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Colaborador
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((colab) => (
            <Card key={colab.id} className="hover:shadow-md transition-shadow border-slate-200">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-sm">
                        {colab.nome
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 leading-tight">{colab.nome}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3 w-3 text-slate-400" />
                          {colab.funcao}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <DollarSign className="h-3 w-3 text-emerald-600" />
                          {colab.valor_hora && colab.valor_hora > 0
                            ? formatCurrency(colab.valor_hora)
                            : 'Valor da hora não definido'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/novo-registro?colaboradorId=${colab.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    + Lançar Hora Extra
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(colab)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      title="Editar colaborador"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(colab.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Remover colaborador"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
            <DialogDescription>
              {editingColaborador
                ? 'Atualize o nome e o cargo/função do colaborador.'
                : 'Preencha os dados do colaborador para adicioná-lo ao sistema de ponto.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-slate-700">
                Nome Completo
              </Label>
              <Input
                id="nome"
                placeholder="Ex.: Carlos Eduardo Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="funcao" className="text-xs font-semibold text-slate-700">
                Função / Cargo
              </Label>
              <Input
                id="funcao"
                placeholder="Ex.: Motorista Carreteiro, Operador Logístico..."
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="valor_hora_colaborador"
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                Valor da Hora (R$) — pré-definido
              </Label>
              <Input
                id="valor_hora_colaborador"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex.: 25.00"
                value={valorHora}
                onChange={(e) => setValorHora(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">
                Usado automaticamente ao lançar uma hora extra deste colaborador (pode ser
                sobrescrito no lançamento).
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {editingColaborador ? 'Salvar Alterações' : 'Cadastrar'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o colaborador do cadastro. Registros de horas extras vinculados a
              ele também serão excluídos do histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
