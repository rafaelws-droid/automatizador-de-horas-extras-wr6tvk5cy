import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { registrosService } from '@/services/registros'
import { colaboradoresService } from '@/services/colaboradores'
import { equipamentosService } from '@/services/equipamentos'
import type { Colaborador, Equipamento, RegistroHoraExtra } from '@/types'
import { EMPRESAS, LOCAIS_TRABALHO } from '@/types'
import {
  formatCurrency,
  formatDateBR,
  exportRegistrosToCsv,
  buildRelatorioResumo,
  sanitizeFilename,
  type RelatorioResumo,
  type AssinaturasRelatorioInfo,
} from '@/lib/exportUtils'
import { exportRegistrosToXlsx } from '@/lib/exportXlsx'
import { exportRegistrosToPdf } from '@/lib/exportPdf'
import { AssinaturasRelatorio } from '@/components/AssinaturasRelatorio'
import {
  FileBarChart,
  FileSpreadsheet,
  FileText,
  FileDown,
  Search,
  Building2,
  MapPin,
  Wrench,
  User,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Loader2,
  Link2,
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
import { useToast } from '@/hooks/use-toast'

export default function Relatorio() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const colaboradorIdParam = searchParams.get('colaboradorId')

  const [registros, setRegistros] = useState<RegistroHoraExtra[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filterColaborador, setFilterColaborador] = useState<string>(colaboradorIdParam || 'todos')
  const [filterEmpresa, setFilterEmpresa] = useState<string>('todas')
  const [filterLocal, setFilterLocal] = useState<string>('todos')
  const [filterEquipamento, setFilterEquipamento] = useState<string>('todos')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [regs, cols, eqs] = await Promise.all([
        registrosService.getAll(),
        colaboradoresService.getAll(),
        equipamentosService.getAll(),
      ])
      setRegistros(regs)
      setColaboradores(cols)
      setEquipamentos(eqs)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível buscar os lançamentos.',
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

  const filteredRegistros = useMemo(() => {
    return registros
      .filter((reg) => {
        if (filterColaborador !== 'todos' && reg.colaborador !== filterColaborador) return false
        if (filterEmpresa !== 'todas' && (reg.expand?.colaborador?.empresa || '') !== filterEmpresa)
          return false
        if (filterLocal !== 'todos' && (reg.local_trabalho || '') !== filterLocal) return false
        if (filterEquipamento !== 'todos' && (reg.equipamento || '') !== filterEquipamento)
          return false
        if (dataInicio && reg.data < dataInicio) return false
        if (dataFim && reg.data > dataFim) return false
        return true
      })
      .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0))
  }, [
    registros,
    filterColaborador,
    filterEmpresa,
    filterLocal,
    filterEquipamento,
    dataInicio,
    dataFim,
  ])

  const resumo: RelatorioResumo = useMemo(
    () => buildRelatorioResumo(filteredRegistros),
    [filteredRegistros],
  )

  const getEquipamentoIdent = (id?: string) =>
    equipamentos.find((eq) => eq.id === id)?.identificacao || id || ''

  const hasFiltros =
    filterColaborador !== 'todos' ||
    filterEmpresa !== 'todas' ||
    filterLocal !== 'todos' ||
    filterEquipamento !== 'todos' ||
    !!dataInicio ||
    !!dataFim

  const limparFiltros = () => {
    setFilterColaborador('todos')
    setFilterEmpresa('todas')
    setFilterLocal('todos')
    setFilterEquipamento('todos')
    setDataInicio('')
    setDataFim('')
  }

  const getTituloFiltros = () => {
    const partes: string[] = []
    if (filterColaborador !== 'todos') {
      const colab = colaboradores.find((c) => c.id === filterColaborador)
      partes.push(`Colaborador: ${colab?.nome || '—'}`)
    }
    if (filterEmpresa !== 'todas') partes.push(`Empresa: ${filterEmpresa}`)
    if (filterLocal !== 'todos') partes.push(`Local: ${filterLocal}`)
    if (filterEquipamento !== 'todos')
      partes.push(`Equipamento: ${getEquipamentoIdent(filterEquipamento)}`)
    if (dataInicio) partes.push(`De: ${formatDateBR(dataInicio)}`)
    if (dataFim) partes.push(`Até: ${formatDateBR(dataFim)}`)
    return partes.length > 0 ? partes.join(' | ') : 'Todos os lançamentos'
  }

  const getNomeColaboradorFiltro = () =>
    filterColaborador !== 'todos'
      ? colaboradores.find((c) => c.id === filterColaborador)?.nome || null
      : null

  // Nome de arquivo seguro para Windows (sem espaços, acentos ou caracteres inválidos)
  const getNomeArquivo = () => {
    const colab = getNomeColaboradorFiltro()
    const base = colab ? `relatorio_${sanitizeFilename(colab)}` : 'relatorio_geral'
    return `${base}_${dataInicio || 'inicio'}_${dataFim || dataHoje}`
  }

  const getAssinaturas = (): AssinaturasRelatorioInfo => ({
    nomeColaborador: getNomeColaboradorFiltro(),
  })

  const dataHoje = new Date().toISOString().split('T')[0]

  const validarExportacao = (): number => {
    if (filteredRegistros.length === 0) {
      toast({
        title: 'Nenhum lançamento para exportar',
        description: 'Ajuste os filtros ou lance registros primeiro.',
        variant: 'destructive',
      })
      return 0
    }
    return filteredRegistros.length
  }

  const handleExportCsv = () => {
    if (!validarExportacao()) return
    exportRegistrosToCsv(filteredRegistros, getNomeArquivo(), getAssinaturas())
    toast({
      title: 'CSV exportado com sucesso!',
      description: `${filteredRegistros.length} lançamentos exportados.`,
    })
  }

  const handleExportXlsx = () => {
    if (!validarExportacao()) return
    exportRegistrosToXlsx(filteredRegistros, getNomeArquivo(), getAssinaturas())
    toast({
      title: 'Excel exportado com sucesso!',
      description: `${filteredRegistros.length} lançamentos exportados para XLSX.`,
    })
  }

  const handleExportPdf = () => {
    if (!validarExportacao()) return
    const colab =
      filterColaborador !== 'todos'
        ? colaboradores.find((c) => c.id === filterColaborador) || null
        : null
    const empresaFiltro = filterEmpresa !== 'todas' ? filterEmpresa : colab?.empresa || null
    exportRegistrosToPdf(filteredRegistros, {
      titulo: colab ? 'Relatório por Colaborador' : 'Relatório Geral de Horas Extras',
      filtroDescricao: getTituloFiltros(),
      empresa: empresaFiltro,
      resumo,
      nomeColaborador: colab?.nome ?? null,
    })
    toast({
      title: 'PDF gerado com sucesso!',
      description: `${filteredRegistros.length} lançamentos exportados com resumo e logo.`,
    })
  }

  const nomeColaboradorAtalho = colaboradorIdParam
    ? colaboradores.find((c) => c.id === colaboradorIdParam)?.nome
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileBarChart className="h-7 w-7 text-blue-600" />
            Relatórios
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Relatório geral ou individual com filtros combináveis de empresa, colaborador, local,
            equipamento e período.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={handleExportPdf}
            disabled={filteredRegistros.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
          <Button
            onClick={handleExportXlsx}
            disabled={filteredRegistros.length === 0}
            className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={handleExportCsv}
            disabled={filteredRegistros.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {nomeColaboradorAtalho && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-800">
          <Link2 className="h-4 w-4 shrink-0" />
          <span>
            Relatório aberto pelo atalho do colaborador <strong>{nomeColaboradorAtalho}</strong>.
            Ajuste os filtros abaixo se precisar — ou{' '}
            <button type="button" onClick={limparFiltros} className="underline font-medium">
              veja o relatório geral
            </button>
            .
          </span>
        </div>
      )}

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            Filtros (combináveis)
          </CardTitle>
          <CardDescription className="text-xs">
            Combine empresa, colaborador, local, equipamento e período. Os filtros se aplicam
            juntos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <LabelEmpresa />
            <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                <Building2 className="h-3.5 w-3.5 text-slate-400 mr-1" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as empresas</SelectItem>
                {EMPRESAS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <LabelColaborador />
            <Select value={filterColaborador} onValueChange={setFilterColaborador}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                <User className="h-3.5 w-3.5 text-slate-400 mr-1" />
                <SelectValue placeholder="Colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os colaboradores</SelectItem>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} {c.empresa ? `(${c.empresa})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <LabelLocal />
            <Select value={filterLocal} onValueChange={setFilterLocal}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1" />
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os locais</SelectItem>
                {LOCAIS_TRABALHO.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <LabelEquipamento />
            <Select value={filterEquipamento} onValueChange={setFilterEquipamento}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                <Wrench className="h-3.5 w-3.5 text-slate-400 mr-1" />
                <SelectValue placeholder="Equipamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os equipamentos</SelectItem>
                {equipamentos.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.identificacao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <LabelPeriodo />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs"
                placeholder="Início"
              />
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs"
                placeholder="Fim"
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={limparFiltros}
              className="w-full text-xs flex items-center gap-2"
            >
              <Search className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ResumoCard
          titulo="Lançamentos"
          valor={String(resumo.quantidade)}
          icone={<FileText className="h-5 w-5" />}
          cor="bg-blue-50 text-blue-600"
        />
        <ResumoCard
          titulo="Horas brutas"
          valor={`${resumo.horasBrutas.toFixed(2)} h`}
          icone={<Clock className="h-5 w-5" />}
          cor="bg-amber-50 text-amber-600"
        />
        <ResumoCard
          titulo="Horas líquidas"
          valor={`${resumo.horasLiquidas.toFixed(2)} h`}
          icone={<Clock className="h-5 w-5" />}
          cor="bg-indigo-50 text-indigo-600"
        />
        <ResumoCard
          titulo="Valor total"
          valor={formatCurrency(resumo.valorTotal)}
          icone={<DollarSign className="h-5 w-5" />}
          cor="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* Tabela de lançamentos */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-sm">Carregando relatório...</p>
          </div>
        </div>
      ) : filteredRegistros.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <FileBarChart className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum lançamento encontrado</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
            {hasFiltros
              ? 'Nenhum lançamento corresponde aos filtros. Tente ampliar o período ou remover filtros.'
              : 'Ainda não há horas extras lançadas.'}
          </p>
          {hasFiltros && (
            <Button variant="outline" size="sm" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Colaborador</th>
                  <th className="py-3 px-3">Empresa</th>
                  <th className="py-3 px-3">Local</th>
                  <th className="py-3 px-3">Equipamento</th>
                  <th className="py-3 px-3 text-center">Horário</th>
                  <th className="py-3 px-3 text-center">Brutas</th>
                  <th className="py-3 px-3 text-center">Líquidas</th>
                  <th className="py-3 px-3 text-center">Adic.</th>
                  <th className="py-3 px-3 text-right">Valor Hora</th>
                  <th className="py-3 px-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistros.map((reg) => {
                  const colab = reg.expand?.colaborador
                  const horasBrutas = reg.quantidade_horas ? reg.quantidade_horas + 1 : 0
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 whitespace-nowrap">{formatDateBR(reg.data)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {colab?.nome || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        {colab?.empresa ? (
                          <Badge
                            variant="outline"
                            className={
                              colab.empresa === 'RAFAEL'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : colab.empresa === 'RUANN'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-purple-100 text-purple-800 border-purple-200'
                            }
                          >
                            {colab.empresa}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600">
                        {reg.local_trabalho || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                        {reg.equipamento ? (
                          getEquipamentoIdent(reg.equipamento) || (
                            <span className="text-slate-400 italic">removido</span>
                          )
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs whitespace-nowrap">
                        {reg.hora}
                        {reg.hora_fim ? `–${reg.hora_fim}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {reg.hora_fim ? horasBrutas : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold">
                        {reg.quantidade_horas} h
                      </td>
                      <td className="py-2.5 px-3 text-center">
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
                      <td className="py-2.5 px-3 text-right font-mono text-xs">
                        {formatCurrency(reg.valor_hora)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(reg.valor_total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/60 p-3 px-4 text-xs text-slate-500">
            Exibindo <strong>{filteredRegistros.length}</strong> lançamento(s) — filtros:{' '}
            {getTituloFiltros()}
          </div>
        </div>
      )}

      {/* Assinaturas: colaborador + RH Silveira Transportes */}
      {!isLoading && filteredRegistros.length > 0 && (
        <AssinaturasRelatorio nomeColaborador={getNomeColaboradorFiltro()} />
      )}

      <p className="text-xs text-slate-400 text-center">
        Registros antigos sem local/equipamento aparecem nos relatórios com os campos em branco.
      </p>
      <div className="flex justify-center">
        <Link to="/registros" className="text-xs text-blue-600 hover:underline">
          Ver histórico completo →
        </Link>
      </div>
    </div>
  )
}

function LabelEmpresa() {
  return <span className="text-[11px] font-semibold text-slate-600">Empresa</span>
}
function LabelColaborador() {
  return <span className="text-[11px] font-semibold text-slate-600">Colaborador</span>
}
function LabelLocal() {
  return <span className="text-[11px] font-semibold text-slate-600">Local de Trabalho</span>
}
function LabelEquipamento() {
  return <span className="text-[11px] font-semibold text-slate-600">Equipamento</span>
}
function LabelPeriodo() {
  return <span className="text-[11px] font-semibold text-slate-600">Período (início / fim)</span>
}

function ResumoCard({
  titulo,
  valor,
  icone,
  cor,
}: {
  titulo: string
  valor: string
  icone: React.ReactNode
  cor: string
}) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{titulo}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{valor}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${cor}`}>
          {icone}
        </div>
      </CardContent>
    </Card>
  )
}
