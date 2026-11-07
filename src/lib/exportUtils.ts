import type { RegistroHoraExtra } from '@/types'

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

export interface RelatorioIndividualInfo {
  nomeColaborador: string
  funcao: string
  periodo: string
}

/**
 * Exporta o relatório individual de um colaborador (cabeçalho com a marca Silveira,
 * registros em horas líquidas e linha de totais) para CSV compatível com Google Sheets / Excel
 */
export function exportRelatorioIndividualToCsv(
  registros: RegistroHoraExtra[],
  info: RelatorioIndividualInfo,
): void {
  const escapeCsv = (str: string | number) => `"${String(str ?? '').replace(/"/g, '""')}"`
  const num = (n: number) => (n || 0).toFixed(2).replace('.', ',')

  const totalHoras = registros.reduce((acc, r) => acc + (r.quantidade_horas || 0), 0)
  const totalValor = registros.reduce((acc, r) => acc + (r.valor_total || 0), 0)

  const cabecalho: string[][] = [
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

  const rows = registros.map((r) =>
    [
      formatDateBR(r.data),
      r.hora,
      r.hora_fim || '',
      num(r.quantidade_horas),
      r.percentual,
      num(r.valor_hora),
      num(r.valor_total),
      r.observacao || '',
    ].map(escapeCsv),
  )

  const totais = ['Total', '', '', num(totalHoras), '', '', num(totalValor), ''].map(escapeCsv)

  const linhas = [
    ...cabecalho.map((linha) => linha.map(escapeCsv).join(';')),
    headers.map(escapeCsv).join(';'),
    ...rows.map((linha) => linha.join(';')),
    totais.join(';'),
  ]

  // BOM para garantir que Excel e Google Sheets abram corretamente com acentos UTF-8
  const csvContent = '\uFEFF' + linhas.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const todayStr = new Date().toISOString().split('T')[0]
  const nomeArquivo = info.nomeColaborador
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
  link.setAttribute('href', url)
  link.setAttribute('download', `relatorio_${nomeArquivo || 'colaborador'}_${todayStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta registros de horas extras para arquivo CSV compatível com Google Sheets / Excel
 */
export function exportRegistrosToCsv(
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

  const rows = registros.map((r) => {
    const nomeColaborador = r.expand?.colaborador?.nome || 'Colaborador não encontrado'
    const funcaoColaborador = r.expand?.colaborador?.funcao || '-'
    const dataFormatada = formatDateBR(r.data)
    const valorHoraStr = (r.valor_hora || 0).toFixed(2).replace('.', ',')
    const valorTotalStr = (r.valor_total || 0).toFixed(2).replace('.', ',')
    const criadoEm = r.created ? new Date(r.created).toLocaleString('pt-BR') : '-'

    const escapeCsv = (str: string | number) => {
      const s = String(str ?? '').replace(/"/g, '""')
      return `"${s}"`
    }

    return [
      escapeCsv(r.id),
      escapeCsv(nomeColaborador),
      escapeCsv(funcaoColaborador),
      escapeCsv(dataFormatada),
      escapeCsv(r.hora),
      escapeCsv(r.hora_fim || ''),
      escapeCsv((r.quantidade_horas || 0).toString().replace('.', ',')),
      escapeCsv(valorHoraStr),
      escapeCsv(r.percentual),
      escapeCsv(valorTotalStr),
      escapeCsv(r.observacao || ''),
      escapeCsv(criadoEm),
    ].join(';')
  })

  // BOM para garantir que Excel e Google Sheets abram corretamente com acentos UTF-8
  const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const todayStr = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `${filenamePrefix}_${todayStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
