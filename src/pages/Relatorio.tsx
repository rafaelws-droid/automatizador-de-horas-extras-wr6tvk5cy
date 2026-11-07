import { useEffect, useMemo, useState } from 'react'
import { registrosService } from '@/services/registros'
import { colaboradoresService } from '@/services/colaboradores'
import type { RegistroHoraExtra, Colaborador } from '@/types'
import { formatCurrency, formatDateBR, exportRelatorioIndividualToCsv } from '@/lib/exportUtils'
import { exportRelatorioIndividualToXlsx } from '@/lib/exportXlsx'
import logoSilveira from '@/assets/logo-silveira-sem-fundo-azul-1-1abbf.png'
import {
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Clock,
  DollarSign,
  Loader2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function Relatorio() {
  const { toast } = useToast()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [colaboradorId, setColaboradorId] = useState<string>('')
  const [registros, setRegistros] = useState<RegistroHoraExtra[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Período opcional (YYYY-MM-DD)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    colaboradoresService
      .getAll()
      .then(setColaboradores)
      .catch((err) => {
        console.error(err)
        toast({
          title: 'Erro ao carregar colaboradores',
          description: 'Não foi possível buscar a lista de colaboradores.',
          variant: 'destructive',
        })
      })
  }, [])

  useEffect(() => {
    if (!colaboradorId) {
      setRegistros([])
      return
    }
    let cancelled = false
    setIsLoading(true)
    registrosService
      .getAll(`colaborador = "${colaboradorId}"`)
      .then((data) => {
        if (!cancelled) setRegistros(data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) {
          toast({
            title: 'Erro ao carregar registros',
            description: 'Não foi possível buscar os registros do colaborador.',
            variant: 'destructive',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [colaboradorId])

  const colaboradorSelecionado = colaboradores.find((c) => c.id === colaboradorId)

  // Registros do período, em ordem cronológica
  const registrosPeriodo = useMemo(() => {
    return registros
      .filter((r) => (!dataInicio || r.data >= dataInicio) && (!dataFim || r.data <= dataFim))
      .sort((a, b) => a.data.localeCompare(b.data) || (a.hora || '').localeCompare(b.hora || ''))
  }, [registros, dataInicio, dataFim])

  const totalHorasLiquidas = registrosPeriodo.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0)
  const valorTotal = registrosPeriodo.reduce((acc, r) => acc + (r.valor_total || 0), 0)

  const periodoTexto =
    dataInicio || dataFim
      ? `${dataInicio ? formatDateBR(dataInicio) : 'início'} a ${dataFim ? formatDateBR(dataFim) : 'hoje'}`
      : 'Todo o período'

  const infoExportacao = colaboradorSelecionado
    ? {
        nomeColaborador: colaboradorSelecionado.nome,
        funcao: colaboradorSelecionado.funcao,
        periodo: periodoTexto,
      }
    : null

  const validarExportacao = () => {
    if (!colaboradorSelecionado || registrosPeriodo.length === 0) {
      toast({
        title: 'Nada para exportar',
        description: 'Selecione um colaborador com registros no período.',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handleExportCsv = () => {
    if (!validarExportacao() || !infoExportacao) return
    exportRelatorioIndividualToCsv(registrosPeriodo, infoExportacao)
    toast({
      title: 'Relatório exportado com sucesso!',
      description: `${registrosPeriodo.length} registros de ${colaboradorSelecionado?.nome} exportados para CSV.`,
    })
  }

  const handleExportXlsx = () => {
    if (!validarExportacao() || !infoExportacao) return
    exportRelatorioIndividualToXlsx(registrosPeriodo, infoExportacao)
    toast({
      title: 'Arquivo Excel exportado com sucesso!',
      description: `${registrosPeriodo.length} registros de ${colaboradorSelecionado?.nome} exportados para XLSX.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com logo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={logoSilveira}
            alt="Logo Silveira"
            className="h-16 w-16 rounded-lg bg-white object-contain"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileBarChart className="h-7 w-7 text-blue-600" />
              Relatório Individual
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Horas extras líquidas (com desconto de refeição), percentuais e valores por
              colaborador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={handleExportCsv}
            disabled={!colaboradorSelecionado || registrosPeriodo.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            onClick={handleExportXlsx}
            disabled={!colaboradorSelecionado || registrosPeriodo.length === 0}
            className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar XLSX
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Colaborador</label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Data inicial</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Data final</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!colaboradorSelecionado ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <User className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Escolha um colaborador</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            O relatório mostra somente os registros do colaborador selecionado.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-sm">Carregando registros...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Identificação do colaborador */}
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-slate-900">{colaboradorSelecionado.nome}</p>
                <p className="text-sm text-slate-500">{colaboradorSelecionado.funcao}</p>
              </div>
              <p className="text-xs text-slate-500">Período: {periodoTexto}</p>
            </CardContent>
          </Card>

          {/* Totais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Registros
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {registrosPeriodo.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileBarChart className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total de Horas Líquidas
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {totalHorasLiquidas.toFixed(2)} h
                  </p>
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
                    Valor Total
                  </p>
                  <p className="text-2xl font-bold text-emerald-800 mt-1">
                    {formatCurrency(valorTotal)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          {registrosPeriodo.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
              <FileBarChart className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Nenhum registro no período</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                Este colaborador não possui horas extras lançadas nesse intervalo de datas.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3.5 px-4">Data</th>
                      <th className="py-3.5 px-4">Horário</th>
                      <th className="py-3.5 px-4 text-center">Horas Líquidas</th>
                      <th className="py-3.5 px-4 text-center">Adicional</th>
                      <th className="py-3.5 px-4 text-right">Valor Hora</th>
                      <th className="py-3.5 px-4 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrosPeriodo.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                          {formatDateBR(reg.data)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                          {reg.hora}
                          {reg.hora_fim ? `–${reg.hora_fim}` : ''}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-semibold">
                          {reg.quantidade_horas} h
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
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-slate-600">
                          {formatCurrency(reg.valor_hora)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-emerald-700">
                          {formatCurrency(reg.valor_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-900">
                    <tr>
                      <td className="py-3 px-4" colSpan={2}>
                        Total
                      </td>
                      <td className="py-3 px-4 text-center">{totalHorasLiquidas.toFixed(2)} h</td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-right text-emerald-800">
                        {formatCurrency(valorTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
