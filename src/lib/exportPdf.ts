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
}

/**
 * Gera o PDF do relatório de horas extras (individual ou consolidado por filtros),
 * com a logo Silveira, identificação da empresa/período e resumo dos resultados.
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

  const todayStr = new Date().toISOString().split('T')[0]
  doc.save(`relatorio_horas_extras_${sanitizeFilename(info.empresa || 'geral')}_${todayStr}.pdf`)
}
