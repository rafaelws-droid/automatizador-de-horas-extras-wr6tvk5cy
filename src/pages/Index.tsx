import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { registrosService } from '@/services/registros'
import { colaboradoresService } from '@/services/colaboradores'
import type { RegistroHoraExtra, Colaborador } from '@/types'
import { formatCurrency, formatDateBR, exportRegistrosToCsv } from '@/lib/exportUtils'
import {
  Clock,
  Users,
  PlusCircle,
  History,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  DollarSign,
  UserCheck,
  CalendarDays,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const { toast } = useToast()
  const [recentRegistros, setRecentRegistros] = useState<RegistroHoraExtra[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [allRegistros, setAllRegistros] = useState<RegistroHoraExtra[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [colabs, regs, recent] = await Promise.all([
        colaboradoresService.getAll(),
        registrosService.getAll(),
        registrosService.getRecent(5),
      ])
      setColaboradores(colabs)
      setAllRegistros(regs)
      setRecentRegistros(recent)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar painel',
        description: 'Não foi possível carregar os dados recentes.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // KPI figures
  const totalHorasGeral = allRegistros.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0)
  const valorTotalGeral = allRegistros.reduce((acc, r) => acc + (r.valor_total || 0), 0)

  const handleExportCsv = () => {
    if (allRegistros.length === 0) {
      toast({
        title: 'Sem registros para exportar',
        description: 'Faça o lançamento de horas extras primeiro.',
        variant: 'destructive',
      })
      return
    }
    exportRegistrosToCsv(allRegistros, 'horas_extras_geral')
    toast({
      title: 'Planilha exportada com sucesso!',
      description: 'Arquivo pronto para ser importado no Google Sheets.',
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge className="bg-blue-500/40 text-blue-100 hover:bg-blue-500/50 border-none font-medium px-2.5 py-0.5">
              Gestão de Horas Extras
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Automatizador de Horas Extras
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Lance apontamentos de horas extras com cálculo automático (50% e 100%), acompanhe os
              valores acumulados e exporte relatórios consolidados para o Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <Button
              asChild
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-md font-semibold"
            >
              <Link to="/novo-registro" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Lançar Hora Extra
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="bg-blue-800/40 text-white border-blue-400/40 hover:bg-blue-800/60"
            >
              <Link to="/colaboradores" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Colaboradores
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Colaboradores */}
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Colaboradores
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '-' : colaboradores.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Cadastrados no RH</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Lançamentos */}
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lançamentos
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '-' : allRegistros.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Apontamentos salvos</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Soma Horas Extras */}
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Horas Acumuladas
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '-' : `${totalHorasGeral.toFixed(1)} h`}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Total de horas extras</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Valor Total Geral */}
        <Card className="border-slate-200 bg-gradient-to-br from-emerald-500/10 via-white to-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Valor Total (R$)
              </p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">
                {isLoading ? '-' : formatCurrency(valorTotalGeral)}
              </h3>
              <p className="text-[11px] text-emerald-700 mt-0.5">Calculado c/ adicionais</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Recent Registros + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registros (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Lançamentos Recentes
                </CardTitle>
                <CardDescription className="text-xs">
                  Últimas horas extras registradas no sistema
                </CardDescription>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                <Link to="/registros" className="flex items-center gap-1">
                  Ver todos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : recentRegistros.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  Nenhum registro lançado ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentRegistros.map((reg) => (
                    <div
                      key={reg.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-lg px-2 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm truncate">
                            {reg.expand?.colaborador?.nome || 'Colaborador'}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${
                              reg.percentual === '100%'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {reg.percentual}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>
                            {formatDateBR(reg.data)} às {reg.hora}
                            {reg.hora_fim ? `–${reg.hora_fim}` : ''}
                          </span>
                          <span>•</span>
                          <span>{reg.quantidade_horas} hora(s)</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-700 text-sm">
                          {formatCurrency(reg.valor_total)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {formatCurrency(reg.valor_hora)}/h
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Google Sheets Helper (1 col) */}
        <div className="space-y-5">
          {/* Export to Google Sheets Helper */}
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Exportar p/ Google Sheets
              </CardTitle>
              <CardDescription className="text-xs">
                Gere uma planilha com todos os lançamentos para sincronizar com sua planilha online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                O arquivo gerado é compatível com Google Sheets e Excel (formato CSV formatado com
                nomes, funções, horas, adicionais e totais).
              </p>

              <Button
                onClick={handleExportCsv}
                disabled={allRegistros.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Baixar Planilha de Registros
              </Button>
            </CardContent>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Atalhos Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                to="/novo-registro"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-blue-600" />
                  Lançar nova hora extra
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                to="/colaboradores"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Gerenciar equipe & cargos
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                to="/registros"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-600" />
                  Ver histórico completo
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
