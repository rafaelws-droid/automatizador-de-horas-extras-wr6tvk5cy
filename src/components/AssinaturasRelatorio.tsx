import { PenLine } from 'lucide-react'

/**
 * Bloco de aprovação do relatório: duas assinaturas lado a lado —
 * a do colaborador (objeto do relatório) e a do responsável do RH
 * da Silveira Transportes. Layout pensado para impressão (A4).
 */
export function AssinaturasRelatorio({ nomeColaborador }: { nomeColaborador?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 print:break-inside-avoid">
      <div className="flex items-center gap-2 mb-4">
        <PenLine className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Aprovação do relatório
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
        {/* Colaborador */}
        <div className="text-center">
          <p className="text-xs font-medium text-slate-600 mb-10 sm:mb-12">
            Colaborador — {nomeColaborador || '____________________'}
          </p>
          <div className="border-t border-slate-800" />
          <p className="text-[11px] text-slate-500 mt-1.5">Assinatura do colaborador</p>
        </div>

        {/* RH Silveira */}
        <div className="text-center">
          <p className="text-xs font-medium text-slate-600 mb-10 sm:mb-12">
            RH Silveira Transportes
          </p>
          <div className="border-t border-slate-800" />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Assinatura do responsável do RH — Data: ____/____/____
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Nome legível: ____________________</p>
        </div>
      </div>
    </div>
  )
}
