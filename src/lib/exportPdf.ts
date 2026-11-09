import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { RegistroHoraExtra } from '@/types'
import {
  formatCurrency,
  formatDateBR,
  nomeEquipamento,
  empresaColaborador,
  sanitizeFilename,
  type RelatorioResumo,
} from './exportUtils'
import logoSilveira from '@/assets/logo-silveira-sem-fundo-azul-1-1abbf.png'

const num = (n: number) => (n || 0).toFixed(2).replace('.', ',')

export interface PdfRelatorioInfo {
  titulo: string
  filtroDescricao: string
  empresa?: string | null
  resumo: RelatorioResumo
  /** Nome do colaborador do relatório individual (para o campo de assinatura). */
  nomeColaborador?: string | null
}

/**
 * Gera o PDF do relatório de horas extras (individual ou consolidado por filtros),
 * com a logo Silveira, identificação da empresa/período, resumo dos resultados e
 * os dois campos de assinatura (colaborador + RH Silveira Transportes) no rodapé.
 */
export function exportRegistrosToPdf(registros: RegistroHoraExtra[], info: PdfRelatorioInfo): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Cabeçalho: logo + título
  try {
    doc.addImage(logoSilveira, 'PNG', 14, 8, 22, 22)
  } catch {
    // logo opcional: segue sem imagem se falhar o carregamento
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text('SILVEIRA TRANSPORTES', 40, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.text(info.titulo, 40, 22)
  doc.setFontSize(9)
  doc.text(`Empresa: ${info.empresa || 'Todas'}`, 40, 27.5)
  doc.text(info.filtroDescricao, 40, 32)
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 14, 15, {
    align: 'right',
  })

  // Resumo (totais)
  const r = info.resumo
  autoTable(doc, {
    startY: 38,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    head: [['Lançamentos', 'Horas Brutas', 'Desconto Refeição', 'Horas Líquidas', 'Valor Total']],
    body: [
      [
        String(r.quantidade),
        `${num(r.horasBrutas)} h`,
        `${num(r.descontoRefeicao)} h`,
        `${num(r.horasLiquidas)} h`,
        formatCurrency(r.valorTotal),
      ],
    ],
    margin: { left: 14, right: 14 },
  })

  // Tabela de lançamentos
  const tableStart = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  autoTable(doc, {
    startY: tableStart + 5,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    head: [
      [
        'Data',
        'Colaborador',
        'Empresa',
        'Horário',
        'Local de Trabalho',
        'Equipamento',
        'Brutas',
        'Líquidas',
        'Adicional',
        'Valor Hora (R$)',
        'Valor Total (R$)',
      ],
    ],
    body: registros.map((reg) => {
      const brutas = reg.hora_fim ? (reg.quantidade_horas || 0) + 1 : reg.quantidade_horas || 0
      return [
        formatDateBR(reg.data),
        reg.expand?.colaborador?.nome || '-',
        empresaColaborador(reg),
        `${reg.hora}${reg.hora_fim ? `–${reg.hora_fim}` : ''}`,
        reg.local_trabalho || '-',
        nomeEquipamento(reg),
        num(brutas),
        num(reg.quantidade_horas),
        reg.percentual,
        num(reg.valor_hora),
        num(reg.valor_total),
      ]
    }),
    foot: [
      [
        'Total',
        '',
        '',
        '',
        '',
        '',
        '',
        num(r.horasBrutas),
        num(r.horasLiquidas),
        '',
        num(r.valorTotal),
      ],
    ],
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'left',
    },
    margin: { left: 14, right: 14 },
  })

  // Assinaturas (aprovação pelas duas partes): sempre em bloco próprio,
  // em nova página se o rodapé não couber inteiro na atual (evita cortar
  // ao imprimir / salvar PDF pelo Edge ou Chrome no Windows).
  const pageHeight = doc.internal.pageSize.getHeight()
  const assinaturasHeight = 34
  let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  if (finalY + assinaturasHeight > pageHeight - 12) {
    doc.addPage()
    finalY = 16
  }

  const y = finalY + 12
  const colEsquerda = 30
  const colDireita = pageWidth / 2 + 30
  const lineWidth = pageWidth / 2 - 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('APROVAÇÃO DO RELATÓRIO', 14, y - 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)

  // Assinatura do colaborador (nome impresso acima da linha)
  const nomeColab = info.nomeColaborador?.trim()
  if (nomeColab) {
    doc.text(`Colaborador: ${nomeColab}`, colEsquerda + lineWidth / 2, y - 6, { align: 'center' })
  }
  doc.setDrawColor(30, 41, 59)
  doc.setLineWidth(0.3)
  doc.line(colEsquerda, y, colEsquerda + lineWidth, y)
  doc.text('Assinatura do colaborador', colEsquerda + lineWidth / 2, y + 4, { align: 'center' })

  // Assinatura do RH Silveira Transportes
  doc.text('RH Silveira Transportes', colDireita + lineWidth / 2, y - 6, { align: 'center' })
  doc.line(colDireita, y, colDireita + lineWidth, y)
  doc.text(
    'Assinatura do responsável do RH — Data: ____/____/____',
    colDireita + lineWidth / 2,
    y + 4,
    { align: 'center' },
  )

  const todayStr = new Date().toISOString().split('T')[0]
  const nomeBase = sanitizeFilename(info.nomeColaborador || 'geral')
  doc.save(`relatorio_horas_extras_${nomeBase}_${todayStr}.pdf`)
}
