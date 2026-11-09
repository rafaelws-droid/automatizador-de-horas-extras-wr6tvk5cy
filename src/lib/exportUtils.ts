import type { RegistroHoraExtra } from '@/types'
import { DESCONTO_REFEICAO_HORAS } from '@/services/registros'

/**
 * Formata valor numérico para moeda brasileira (R$)
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data no formato brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  try {
    const [year, month, day] = dateStr.split('-')
    if (year && month && day) {
      return `${day}/${month}/${year}`
    }
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

/** Nome de exibição do equipamento a partir do registro (com expand resolvido). */
export function nomeEquipamento(reg: RegistroHoraExtra): string {
  return reg.expand?.equipamento?.identificacao || '-'
}

/** Empresa do colaborador do registro (a partir do expand). */
export function empresaColaborador(reg: RegistroHoraExtra): string {
  return reg.expand?.colaborador?.empresa || '-'
}

export interface RelatorioIndividualInfo {
  nomeColaborador: string
  funcao: string
  empresa: string
  periodo: string
}

/** Assinaturas para aprovação do relatório pelas duas partes (colaborador + RH). */
export interface AssinaturasRelatorioInfo {
  /** Nome do colaborador do relatório (impresso acima da linha). */
  nomeColaborador?: string | null
}

export interface RelatorioResumo {
  quantidade: number
  horasBrutas: number
  descontoRefeicao: number
  horasLiquidas: number
  valorTotal: number
}

/**
 * Monta o resumo de totais de um conjunto de lançamentos (usado no relatório geral
 * e nas exportações): lançamentos, horas brutas, desconto de refeição, líquidas e valor.
 */
export function buildRelatorioResumo(registros: RegistroHoraExtra[]): RelatorioResumo {
  const horasBrutas = registros.reduce((acc, r) => {
    const brutas = r.hora_fim ? r.quantidade_horas + DESCONTO_REFEICAO_HORAS : r.quantidade_horas
    return acc + brutas
  }, 0)
  const descontoRefeicao = registros.filter((r) => r.hora_fim).length * DESCONTO_REFEICAO_HORAS

  return {
    quantidade: registros.length,
    horasBrutas,
    descontoRefeicao,
    horasLiquidas: registros.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0),
    valorTotal: registros.reduce((acc, r) => acc + (r.valor_total || 0), 0),
  }
}

/**
 * Monta as linhas de dados (valores crus, sem formatação) usadas nas exportações
 * CSV/XLSX/PDF do relatório.
 */
export function buildRegistrosExportRows(registros: RegistroHoraExtra[]): string[][] {
  return registros.map((r) => [
    formatDateBR(r.data),
    r.expand?.colaborador?.nome || '-',
    r.expand?.colaborador?.empresa || '-',
    r.hora,
    r.hora_fim || '',
    r.local_trabalho || '',
    nomeEquipamento(r),
    num(r.quantidade_horas),
    r.percentual,
    num(r.valor_hora),
    num(r.valor_total),
    r.observacao || '',
  ])
}

/**
 * Monta as linhas finais de assinatura (colaborador + RH Silveira Transportes)
 * usadas nas exportações CSV/XLSX — texto simples + linha em branco para assinar.
 */
export function blocosAssinaturaCsv(assinaturas: AssinaturasRelatorioInfo): string[][] {
  const nomeColab = assinaturas.nomeColaborador?.trim() || '____________________'
  return [
    [],
    ['APROVAÇÃO DO RELATÓRIO'],
    ['Colaborador', nomeColab, '', 'RH Silveira Transportes', ''],
    [
      'Assinatura do colaborador',
      '',
      '',
      'Assinatura do responsável do RH',
      'Data: ____/____/____',
    ],
    [],
    [],
  ]
}

export function sanitizeFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

const escapeCsv = (str: string | number) => `"${String(str ?? '').replace(/"/g, '""')}"`
const num = (n: number) => (n || 0).toFixed(2).replace('.', ',')

function downloadCsv(csvContent: string, filename: string): void {
  // BOM para garantir que Excel e Google Sheets abram corretamente com acentos UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  // Download manual via âncora — compatível com Edge/Chrome no Windows.
  // A URL só é revogada depois de um atraso: revogar imediatamente após o
  // click() pode cancelar o download nesses navegadores.
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 1000)
}

/**
 * Exporta o relatório individual de um colaborador (cabeçalho com a marca Silveira,
 * registros em horas líquidas e linha de totais) para CSV compatível com Google Sheets / Excel
 */
export function exportRelatorioIndividualToCsv(
  registros: RegistroHoraExtra[],
  info: RelatorioIndividualInfo,
  assinaturas?: AssinaturasRelatorioInfo,
): void {
  const totalHoras = registros.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0)
  const totalValor = registros.reduce((acc, r) => acc + (r.valor_total || 0), 0)

  const cabecalho: string[][] = [
    ['SILVEIRA - Relatório de Horas Extras'],
    ['Colaborador', info.nomeColaborador],
    ['Função', info.funcao || '-'],
    ['Empresa', info.empresa || '-'],
    ['Período', info.periodo],
    [],
  ]

  const headers = [
    'Data',
    'Horário de Início',
    'Horário de Término',
    'Local de Trabalho',
    'Equipamento',
    'Horas Líquidas',
    'Percentual',
    'Valor da Hora (R$)',
    'Valor Total (R$)',
    'Observações',
  ]

  const rows = registros.map((r) =>
    [
      formatDateBR(r.data),
      r.hora,
      r.hora_fim || '',
      r.local_trabalho || '',
      nomeEquipamento(r),
      num(r.quantidade_horas),
      r.percentual,
      num(r.valor_hora),
      num(r.valor_total),
      r.observacao || '',
    ].map(escapeCsv),
  )

  const totais = ['Total', '', '', '', '', num(totalHoras), '', '', num(totalValor), ''].map(
    escapeCsv,
  )

  const linhas = [
    ...cabecalho.map((linha) => linha.map(escapeCsv).join(';')),
    headers.map(escapeCsv).join(';'),
    ...rows.map((linha) => linha.join(';')),
    totais.join(';'),
    ...(assinaturas ? blocosAssinaturaCsv(assinaturas) : []),
  ]

  const todayStr = new Date().toISOString().split('T')[0]
  downloadCsv(
    linhas.join('\r\n'),
    `relatorio_${sanitizeFilename(info.nomeColaborador) || 'colaborador'}_${todayStr}.csv`,
  )
}

/**
 * Exporta registros de horas extras para arquivo CSV compatível com Google Sheets / Excel
 */
export function exportRegistrosToCsv(
  registros: RegistroHoraExtra[],
  filenamePrefix = 'horas_extras',
  assinaturas?: AssinaturasRelatorioInfo,
): void {
  const headers = [
    'ID Registro',
    'Colaborador',
    'Função',
    'Empresa',
    'Data',
    'Horário de Início',
    'Horário de Término',
    'Local de Trabalho',
    'Equipamento',
    'Quantidade de Horas',
    'Valor da Hora (R$)',
    'Percentual',
    'Valor Total (R$)',
    'Observações',
    'Data do Lançamento',
  ]

  const rows = registros.map((r) => {
    const nomeColaborador = r.expand?.colaborador?.nome || 'Colaborador não encontrado'
    const funcaoColaborador = r.expand?.colaborador?.funcao || '-'
    const dataFormatada = formatDateBR(r.data)
    const valorHoraStr = (r.valor_hora || 0).toFixed(2).replace('.', ',')
    const valorTotalStr = (r.valor_total || 0).toFixed(2).replace('.', ',')
    const criadoEm = r.created ? new Date(r.created).toLocaleString('pt-BR') : '-'

    return [
      escapeCsv(r.id),
      escapeCsv(nomeColaborador),
      escapeCsv(funcaoColaborador),
      escapeCsv(empresaColaborador(r)),
      escapeCsv(dataFormatada),
      escapeCsv(r.hora),
      escapeCsv(r.hora_fim || ''),
      escapeCsv(r.local_trabalho || ''),
      escapeCsv(nomeEquipamento(r)),
      escapeCsv((r.quantidade_horas || 0).toString().replace('.', ',')),
      escapeCsv(valorHoraStr),
      escapeCsv(r.percentual),
      escapeCsv(valorTotalStr),
      escapeCsv(r.observacao || ''),
      escapeCsv(criadoEm),
    ].join(';')
  })

  const csvContent = [
    headers.map((h) => `"${h}"`).join(';'),
    ...rows,
    ...(assinaturas ? blocosAssinaturaCsv(assinaturas).map((l) => l.map(escapeCsv).join(';')) : []),
  ].join('\r\n')
  const todayStr = new Date().toISOString().split('T')[0]
  downloadCsv(csvContent, `${filenamePrefix}_${todayStr}.csv`)
}
