import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadErrorProps {
  onRetry: () => void
  title?: string
  message?: string
}

/**
 * Estado de erro de carregamento com botão "Tentar novamente".
 * Usado nas telas quando a busca de dados falha (rede instável, sessão
 * expirada etc.), para que a tela nunca fique presa em branco ou em
 * "carregando" — o usuário sempre tem uma ação clara para recuperar.
 */
export function LoadError({
  onRetry,
  title = 'Erro ao carregar dados',
  message = 'Não foi possível buscar os dados. Verifique sua conexão com a internet e tente novamente.',
}: LoadErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-red-200 text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{message}</p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}

export default LoadError
