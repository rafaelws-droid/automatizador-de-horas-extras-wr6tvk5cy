import * as XLSX from 'xlsx'
import type { RegistroHoraExtra } from '@/types'
import {
  formatDateBR,
  sanitizeFilename,
  nomeEquipamento,
  empresaColaborador,
  type RelatorioIndividualInfo,
  type AssinaturasRelatorioInfo,
} from './exportUtils'

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const num = (n: number) => (n || 0).toFixed(2).replace('.', ',')

function downloadBlob(blob: Blob, filename: string): void {
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
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
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

  const rows = registros.map((r) => [
    r.id,
    r.expand?.colaborador?.nome || 'Colaborador não encontrado',
    r.expand?.colaborador?.funcao || '-',
    empresaColaborador(r),
    formatDateBR(r.data),
    r.hora,
    r.hora_fim || '',
    r.local_trabalho || '',
    nomeEquipamento(r),
    num(r.quantidade_horas),
    num(r.valor_hora),
    r.percentual,
    num(r.valor_total),
    r.observacao || '',
    r.created ? new Date(r.created).toLocaleString('pt-BR') : '-',
  ])

  const wb = XLSX.utils.book_new()
  const aoa: (string | number)[][] = [headers, ...rows]
  if (assinaturas) aoa.push(...blocosAssinaturaXlsx(assinaturas))
  XLSX.utils.book_append_sheet(wb, aoaToSheet(aoa), 'Horas Extras')
  saveWorkbook(wb, sanitizeFilename(filenamePrefix))
}

/** Linhas de assinatura (texto + linha em branco para assinar) no fim da planilha. */
function blocosAssinaturaXlsx(assinaturas: AssinaturasRelatorioInfo): (string | number)[][] {
  const nomeColab = assinaturas.nomeColaborador?.trim() || '____________________'
  return [
    [],
    ['APROVAÇÃO DO RELATÓRIO'],
    ['Colaborador', nomeColab, '', 'RH Silveira Transportes'],
    ['Assinatura do colaborador', '', '', 'Assinatura do responsável do RH — Data: ____/____/____'],
  ]
}

/**
 * Exporta o relatório individual/de filtros para XLSX de verdade (planilha Excel),
 * com o mesmo cabeçalho ("SILVEIRA"), colunas e dados do CSV (exportRelatorioIndividualToCsv).
 */
export function exportRelatorioIndividualToXlsx(
  registros: RegistroHoraExtra[],
  info: RelatorioIndividualInfo,
  assinaturas?: AssinaturasRelatorioInfo,
): void {
  const totalHoras = registros.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0)
  const totalValor = registros.reduce((acc, r) => acc + (r.valor_total || 0), 0)

  const cabecalho: (string | number)[][] = [
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

  const rows = registros.map((r) => [
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
  ])

  const totais = ['Total', '', '', '', '', num(totalHoras), '', '', num(totalValor), '']

  const wb = XLSX.utils.book_new()
  const aoa: (string | number)[][] = [...cabecalho, headers, ...rows, totais]
  if (assinaturas) aoa.push(...blocosAssinaturaXlsx(assinaturas))
  XLSX.utils.book_append_sheet(wb, aoaToSheet(aoa), 'Relatório')
  saveWorkbook(wb, `relatorio_${sanitizeFilename(info.nomeColaborador) || 'colaborador'}`)
}
