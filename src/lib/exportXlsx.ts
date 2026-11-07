import * as XLSX from 'xlsx'
import type { RegistroHoraExtra } from '@/types'
import { formatDateBR, type RelatorioIndividualInfo } from './exportUtils'

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const num = (n: number) => (n || 0).toFixed(2).replace('.', ',')

function sanitizeFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function saveWorkbook(wb: XLSX.WorkBook, filename: string): void {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(
    new Blob([out], { type: MIME_XLSX }),
    `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`,
  )
}

function aoaToSheet(aoa: (string | number)[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 34 },
    { wch: 18 },
  ]
  return ws
}

/**
 * Exporta o histórico de registros de horas extras para XLSX de verdade (planilha Excel),
 * com as mesmas colunas, cabeçalho e dados do CSV (exportRegistrosToCsv).
 */
export function exportRegistrosToXlsx(
  registros: RegistroHoraExtra[],
  filenamePrefix = 'horas_extras',
): void {
  const headers = [
    'ID Registro',
    'Colaborador',
    'Função',
    'Data',
    'Horário de Início',
    'Horário de Término',
    'Quantidade de Horas',
    'Valor da Hora (R$)',
    'Percentual',
    'Valor Total (R$)',
    'Observações',
    'Data do Lançamento',
  ]

  const rows = registros.map((r) => [
    r.id,
    r.expand?.colaborador?.nome || 'Colaborador não encontrado',
    r.expand?.colaborador?.funcao || '-',
    formatDateBR(r.data),
    r.hora,
    r.hora_fim || '',
    num(r.quantidade_horas),
    num(r.valor_hora),
    r.percentual,
    num(r.valor_total),
    r.observacao || '',
    r.created ? new Date(r.created).toLocaleString('pt-BR') : '-',
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, aoaToSheet([headers, ...rows]), 'Horas Extras')
  saveWorkbook(wb, sanitizeFilename(filenamePrefix))
}

/**
 * Exporta o relatório individual de um colaborador para XLSX de verdade (planilha Excel),
 * com o mesmo cabeçalho ("SILVEIRA"), colunas e dados do CSV (exportRelatorioIndividualToCsv).
 */
export function exportRelatorioIndividualToXlsx(
  registros: RegistroHoraExtra[],
  info: RelatorioIndividualInfo,
): void {
  const totalHoras = registros.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0)
  const totalValor = registros.reduce((acc, r) => acc + (r.valor_total || 0), 0)

  const cabecalho: (string | number)[][] = [
    ['SILVEIRA - Relatório Individual de Horas Extras'],
    ['Colaborador', info.nomeColaborador],
    ['Função', info.funcao || '-'],
    ['Período', info.periodo],
    [],
  ]

  const headers = [
    'Data',
    'Horário de Início',
    'Horário de Término',
    'Horas Líquidas',
    'Percentual',
    'Valor da Hora (R$)',
    'Valor Total (R$)',
    'Observações',
  ]

  const rows = registros.map((r) => [
    formatDateBR(r.data),
    r.hora,
    r.hora_fim || '',
    num(r.quantidade_horas),
    r.percentual,
    num(r.valor_hora),
    num(r.valor_total),
    r.observacao || '',
  ])

  const totais = ['Total', '', '', num(totalHoras), '', '', num(totalValor), '']

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    aoaToSheet([...cabecalho, headers, ...rows, totais]),
    'Relatório',
  )
  saveWorkbook(wb, `relatorio_${sanitizeFilename(info.nomeColaborador) || 'colaborador'}`)
}
