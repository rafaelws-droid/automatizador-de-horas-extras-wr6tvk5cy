import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { colaboradoresService } from '@/services/colaboradores'
import { equipamentosService } from '@/services/equipamentos'
import {
  registrosService,
  calcularValorTotalHoraExtra,
  calcularQuantidadeHoras,
  calcularQuantidadeHorasLiquidas,
  DESCONTO_REFEICAO_HORAS,
} from '@/services/registros'
import type { Colaborador, Equipamento, PercentualHoraExtra } from '@/types'
import { LOCAIS_TRABALHO } from '@/types'
import { formatCurrency } from '@/lib/exportUtils'
import {
  Clock,
  Calendar,
  DollarSign,
  User,
  Percent,
  FileText,
  Calculator,
  MapPin,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function NovoRegistro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [isLoadingColabs, setIsLoadingColabs] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [colaboradorId, setColaboradorId] = useState<string>(
    searchParams.get('colaboradorId') || '',
  )
  const [localTrabalho, setLocalTrabalho] = useState<string>('')
  const [equipamentoId, setEquipamentoId] = useState<string>('')
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState<string>('18:00')
  const [horaFim, setHoraFim] = useState<string>('20:00')
  // Quantidade de horas calculada a partir de início/término, com desconto de 1h de refeição
  const horasBrutas = calcularQuantidadeHoras(hora, horaFim)
  const quantidadeHoras = calcularQuantidadeHorasLiquidas(hora, horaFim)
  const [valorHora, setValorHora] = useState<string>('25.00')
  const [percentual, setPercentual] = useState<PercentualHoraExtra>('50%')
  const [observacao, setObservacao] = useState<string>('')

  // Load Colaboradores e Equipamentos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingColabs(true)
        const [list, eqs] = await Promise.all([
          colaboradoresService.getAll(),
          equipamentosService.getAll(),
        ])
        setColaboradores(list)
        setEquipamentos(eqs)
        if (!colaboradorId && list.length > 0) {
          setColaboradorId(list[0].id)
        }
      } catch (err) {
        console.error(err)
        setError('Não foi possível carregar os colaboradores.')
      } finally {
        setIsLoadingColabs(false)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate live preview
  const qHorasNum = Math.max(0, quantidadeHoras)
  const vHoraNum = Math.max(0, parseFloat(valorHora.replace(',', '.')) || 0)
  const valorTotalCalculado = calcularValorTotalHoraExtra(qHorasNum, vHoraNum, percentual)

  // Selected Colaborador details
  const selectedColaborador = colaboradores.find((c) => c.id === colaboradorId)
  const valorHoraPredefinido = selectedColaborador?.valor_hora ?? 0

  // Preenche o campo "Valor Normal da Hora" com o valor pré-definido do cadastro
  // assim que um colaborador é selecionado — inclusive na primeira seleção e quando
  // o colaborador vem pela URL (dispara também quando a lista termina de carregar).
  // Enquanto o MESMO colaborador segue selecionado, o campo permanece editável e
  // não é sobrescrito de volta. Se o colaborador não tem valor cadastrado (0),
  // o campo fica vazio e digitável para preenchimento manual.
  useEffect(() => {
    if (valorHoraPredefinido > 0) {
      setValorHora(valorHoraPredefinido.toFixed(2))
    } else {
      setValorHora('')
    }
  }, [colaboradorId, valorHoraPredefinido])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!colaboradorId) {
      setError('Selecione um colaborador.')
      return
    }
    if (!localTrabalho) {
      setError('Selecione o Local de Trabalho.')
      return
    }
    if (!equipamentoId) {
      setError('Selecione o Equipamento/Veículo utilizado.')
      return
    }
    if (!data) {
      setError('Informe a data da hora extra.')
      return
    }
    if (!hora) {
      setError('Informe o horário de início da hora extra.')
      return
    }
    if (!horaFim) {
      setError('Informe o horário de término da hora extra.')
      return
    }
    if (horaFim === hora) {
      setError('O horário de término deve ser diferente do horário de início.')
      return
    }
    if (qHorasNum <= 0) {
      setError('A quantidade de horas calculada deve ser maior que zero.')
      return
    }
    if (vHoraNum <= 0) {
      setError('O valor base da hora deve ser maior que zero.')
      return
    }

    try {
      setIsSubmitting(true)
      await registrosService.create({
        colaborador: colaboradorId,
        local_trabalho: localTrabalho,
        equipamento: equipamentoId,
        data,
        hora,
        hora_fim: horaFim,
        quantidade_horas: qHorasNum,
        valor_hora: vHoraNum,
        percentual,
        observacao: observacao.trim(),
      })

      toast({
        title: 'Hora extra lançada com sucesso!',
        description: `Registro no valor de ${formatCurrency(valorTotalCalculado)} gravado.`,
      })

      navigate('/registros')
    } catch (err) {
      console.error(err)
      setError('Erro ao salvar o registro de hora extra. Verifique os dados e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Clock className="h-7 w-7 text-blue-600" />
          Novo Registro de Hora Extra
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Lançamento de horas extras com cálculo automático e armazenamento para exportação ao
          Google Sheets.
        </p>
      </div>

      {isLoadingColabs ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Carregando formulário de lançamento...</p>
        </div>
      ) : colaboradores.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6 text-center">
            <Users className="h-10 w-10 text-amber-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Nenhum colaborador cadastrado
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
              Para registrar horas extras, é necessário primeiro cadastrar pelo menos um colaborador
              com nome e função.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/colaboradores">Cadastrar Colaborador</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Informações do Apontamento
              </CardTitle>
              <CardDescription>
                Informe o colaborador, horário, quantidade de horas e percentual aplicado (50% ou
                100%)
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Colaborador */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="colaborador"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  Colaborador
                </Label>
                <Select value={colaboradorId} onValueChange={setColaboradorId}>
                  <SelectTrigger id="colaborador" className="bg-white">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {colaboradores.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} — <span className="text-slate-500 text-xs">({c.funcao})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedColaborador && (
                  <p className="text-xs text-slate-500">
                    Função cadastrada:{' '}
                    <span className="font-medium text-slate-700">{selectedColaborador.funcao}</span>
                    {' — '}
                    Empresa:{' '}
                    <span className="font-medium text-blue-700">
                      {selectedColaborador.empresa || 'não definida'}
                    </span>
                  </p>
                )}
              </div>

              {/* Local de Trabalho */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="local_trabalho"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  Local de Trabalho <span className="text-red-500">*</span>
                </Label>
                <Select value={localTrabalho} onValueChange={setLocalTrabalho}>
                  <SelectTrigger id="local_trabalho" className="bg-white">
                    <SelectValue placeholder="Selecione onde o colaborador trabalhou" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCAIS_TRABALHO.map((local) => (
                      <SelectItem key={local} value={local}>
                        {local}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Equipamento / Veículo */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="equipamento"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5 text-blue-600" />
                  Equipamento / Veículo <span className="text-red-500">*</span>
                </Label>
                <Select value={equipamentoId} onValueChange={setEquipamentoId}>
                  <SelectTrigger id="equipamento" className="bg-white">
                    <SelectValue placeholder="Selecione o equipamento utilizado" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentos.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.identificacao}
                        {eq.descricao ? (
                          <span className="text-slate-500 text-xs"> — {eq.descricao}</span>
                        ) : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equipamentos.length === 0 ? (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Nenhum equipamento cadastrado —{' '}
                    <Link to="/equipamentos" className="underline font-medium">
                      cadastrar equipamento
                    </Link>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Equipamentos podem variar entre lançamentos —{' '}
                    <Link to="/equipamentos" className="underline">
                      gerenciar
                    </Link>
                  </p>
                )}
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="data"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    Data da Hora Extra
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="hora"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Horário de Início
                  </Label>
                  <Input
                    id="hora"
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="hora_fim"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Horário de Término
                  </Label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Virada de meia-noite aceita (ex.: 22:00 → 02:00 = 4h brutas, 3h líquidas após
                    desconto de refeição).
                  </p>
                </div>
              </div>

              {/* Quantidade de Horas e Valor da Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="quantidade_horas"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Calculator className="h-3.5 w-3.5 text-blue-600" />
                    Quantidade de Horas (calculada automaticamente)
                  </Label>
                  <Input
                    id="quantidade_horas"
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantidadeHoras.toFixed(2).replace(/\.00$/, '')}
                    readOnly
                    tabIndex={-1}
                    className="bg-slate-100 text-slate-800 font-semibold cursor-default"
                    title={`Calculada a partir do horário de início e término, descontando ${DESCONTO_REFEICAO_HORAS}h de refeição`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="valor_hora"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                    Valor Normal da Hora (R$)
                  </Label>
                  <Input
                    id="valor_hora"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ex.: 25.00"
                    value={valorHora}
                    onChange={(e) => setValorHora(e.target.value)}
                    required
                  />
                  {valorHoraPredefinido > 0 ? (
                    <p className="text-[11px] text-emerald-600">
                      Preenchido automaticamente com o valor do cadastro — pode ser ajustado neste
                      lançamento.
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      Colaborador sem valor de hora cadastrado — informe o valor manualmente ou
                      atualize o cadastro.
                    </p>
                  )}
                </div>
              </div>

              {/* Percentual (50% ou 100%) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-blue-600" />
                  Percentual de Hora Extra
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPercentual('50%')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-sm font-semibold transition-all ${
                      percentual === '50%'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base font-bold">50%</span>
                    <span className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Dias úteis e sábados (fator x1.5)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPercentual('100%')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-sm font-semibold transition-all ${
                      percentual === '100%'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base font-bold">100%</span>
                    <span className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Domingos e feriados (fator x2.0)
                    </span>
                  </button>
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="observacao"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Observações / Motivo (opcional)
                </Label>
                <Textarea
                  id="observacao"
                  placeholder="Ex.: Atraso na entrega, plantão emergencial, fechamento mensal..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Side Card: Resumo & Cálculo Automático */}
          <div className="space-y-4">
            <Card className="border-blue-200 bg-gradient-to-b from-blue-50/70 to-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Cálculo Automático
                </CardTitle>
                <CardDescription className="text-xs">
                  Atualizado em tempo real conforme você preenche os campos
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-600">Horas do intervalo (brutas):</span>
                  <span className="font-semibold text-slate-800">{horasBrutas} hora(s)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-600">Desconto de refeição:</span>
                  <span className="font-semibold text-red-600">
                    −{DESCONTO_REFEICAO_HORAS} hora
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-600">Horas líquidas apontadas:</span>
                  <span className="font-semibold text-slate-800">{qHorasNum} hora(s)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-600">Valor base da hora:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(vHoraNum)}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-600">Adicional de HE:</span>
                  <span className="font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-[11px]">
                    +{percentual} ({percentual === '100%' ? 'x2.0' : 'x1.5'})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-600">Valor da hora com adicional:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(vHoraNum * (percentual === '100%' ? 2.0 : 1.5))}
                  </span>
                </div>

                {/* Destaque do Valor Total */}
                <div className="mt-3 p-3.5 bg-blue-600 text-white rounded-xl shadow-md">
                  <div className="text-[11px] font-medium text-blue-100 uppercase tracking-wider">
                    Valor Total Calculado
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight mt-1">
                    {formatCurrency(valorTotalCalculado)}
                  </div>
                  <div className="text-[11px] text-blue-200 mt-1">
                    {qHorasNum}h × {formatCurrency(vHoraNum)} ×{' '}
                    {percentual === '100%' ? '200%' : '150%'}
                  </div>
                  <div className="text-[11px] text-blue-100 mt-1.5 pt-1.5 border-t border-blue-500/40">
                    {hora} às {horaFim} — {horasBrutas}h brutas − 1h refeição = {qHorasNum}h
                    líquidas
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gravando registro...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Salvar Registro
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/70 text-xs text-slate-600">
              <CardContent className="p-4 space-y-1.5">
                <span className="font-semibold text-slate-800 block">Dica de Exportação</span>
                <p>
                  Todos os lançamentos ficam salvos de forma permanente e podem ser exportados a
                  qualquer momento em formato de planilha para alimentar o Google Sheets.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      )}
    </div>
  )
}
