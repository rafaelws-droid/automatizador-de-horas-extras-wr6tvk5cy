import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { registrosService } from '@/services/registros'
import { colaboradoresService } from '@/services/colaboradores'
import type { RegistroHoraExtra, Colaborador } from '@/types'
import { formatCurrency, formatDateBR, exportRegistrosToCsv } from '@/lib/exportUtils'
import {
  History,
  FileSpreadsheet,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Calendar,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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

export default function Registros() {
  const { toast } = useToast()
  const [registros, setRegistros] = useState<RegistroHoraExtra[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterColaborador, setFilterColaborador] = useState<string>('todos')
  const [filterPercentual, setFilterPercentual] = useState<string>('todos')

  // Deletion modal
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [regsData, colabsData] = await Promise.all([
        registrosService.getAll(),
        colaboradoresService.getAll(),
      ])
      setRegistros(regsData)
      setColaboradores(colabsData)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível buscar o histórico de registros.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setIsDeleting(true)
      await registrosService.delete(deletingId)
      toast({
        title: 'Registro removido',
        description: 'O lançamento foi excluído com sucesso.',
      })
      setDeletingId(null)
      await loadData()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered list
  const filteredRegistros = useMemo(() => {
    return registros.filter((reg) => {
      const colabName = reg.expand?.colaborador?.nome?.toLowerCase() || ''
      const colabFuncao = reg.expand?.colaborador?.funcao?.toLowerCase() || ''
      const obs = reg.observacao?.toLowerCase() || ''
      const term = searchTerm.toLowerCase()

      const matchesSearch =
        !searchTerm ||
        colabName.includes(term) ||
        colabFuncao.includes(term) ||
        obs.includes(term) ||
        reg.data.includes(term)

      const matchesColab = filterColaborador === 'todos' || reg.colaborador === filterColaborador

      const matchesPercentual = filterPercentual === 'todos' || reg.percentual === filterPercentual

      return matchesSearch && matchesColab && matchesPercentual
    })
  }, [registros, searchTerm, filterColaborador, filterPercentual])

  // Summary figures
  const totalHoras = filteredRegistros.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0)
  const valorTotalSoma = filteredRegistros.reduce((acc, r) => acc + (r.valor_total || 0), 0)

  const handleExportCsv = () => {
    if (filteredRegistros.length === 0) {
      toast({
        title: 'Nenhum registro para exportar',
        description: 'Ajuste os filtros ou lance registros primeiro.',
        variant: 'destructive',
      })
      return
    }

    exportRegistrosToCsv(filteredRegistros, 'horas_extras_export')
    toast({
      title: 'Planilha exportada com sucesso!',
      description: `${filteredRegistros.length} registros exportados para CSV/Google Sheets.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="h-7 w-7 text-blue-600" />
            Histórico de Registros
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Visualização completa de horas extras lançadas com valores totais e exportação para o
            Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={handleExportCsv}
            disabled={filteredRegistros.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar para Planilha
          </Button>

          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Link to="/novo-registro" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Novo Lançamento
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total de Registros
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{filteredRegistros.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Soma de Horas Extras
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalHoras.toFixed(1)} h</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-emerald-500/10 via-white to-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Valor Total Acumulado
              </p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">
                {formatCurrency(valorTotalSoma)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por colaborador, função ou observação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>

            {/* Filter by Colaborador */}
            <div>
              <Select value={filterColaborador} onValueChange={setFilterColaborador}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                  <SelectValue placeholder="Filtrar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os colaboradores</SelectItem>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Percentual */}
            <div>
              <Select value={filterPercentual} onValueChange={setFilterPercentual}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                  <SelectValue placeholder="Percentual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os percentuais</SelectItem>
                  <SelectItem value="50%">Apenas 50%</SelectItem>
                  <SelectItem value="100%">Apenas 100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table / List View */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-sm">Carregando histórico de horas extras...</p>
          </div>
        </div>
      ) : filteredRegistros.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <History className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum registro encontrado</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
            {searchTerm || filterColaborador !== 'todos' || filterPercentual !== 'todos'
              ? 'Nenhum lançamento corresponde aos filtros selecionados. Tente ajustar os termos.'
              : 'Nenhuma hora extra foi lançada ainda. Clique no botão abaixo para criar o primeiro registro.'}
          </p>
          {searchTerm || filterColaborador !== 'todos' || filterPercentual !== 'todos' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setFilterColaborador('todos')
                setFilterPercentual('todos')
              }}
            >
              Limpar filtros
            </Button>
          ) : (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/novo-registro">
                <PlusCircle className="h-4 w-4 mr-2" />
                Lançar Primeira Hora Extra
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3.5 px-4">Colaborador</th>
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4 text-center">Horas</th>
                  <th className="py-3.5 px-4 text-right">Valor Hora</th>
                  <th className="py-3.5 px-4 text-center">Adicional</th>
                  <th className="py-3.5 px-4 text-right">Valor Total</th>
                  <th className="py-3.5 px-4">Observação</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistros.map((reg) => {
                  const colabNome = reg.expand?.colaborador?.nome || 'Colaborador não encontrado'
                  const colabFuncao = reg.expand?.colaborador?.funcao || '-'

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {colabNome}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{colabFuncao}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{formatDateBR(reg.data)}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {reg.hora}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {reg.quantidade_horas} h
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-600 font-mono text-xs">
                        {formatCurrency(reg.valor_hora)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={
                            reg.percentual === '100%'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }
                        >
                          {reg.percentual}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-emerald-700 text-base">
                          {formatCurrency(reg.valor_total)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-500">
                        {reg.observacao || (
                          <span className="text-slate-300 italic">Sem observação</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(reg.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Remover registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/60 p-3 px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Exibindo <strong>{filteredRegistros.length}</strong> registro(s) filtrado(s)
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs text-emerald-700 p-0 h-auto font-semibold hover:underline"
            >
              Baixar esses dados para planilha (Google Sheets) &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Modal confirmação de exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lançamento de hora extra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá este registro de hora extra permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Removendo...' : 'Sim, remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
