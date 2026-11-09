import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

/**
 * ErrorBoundary global: se qualquer tela falhar ao renderizar (erro de
 * programação, dado inesperado do banco), o app inteiro não fica em branco —
 * é exibida uma mensagem com botão "Recarregar tela" que recarrega a página.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Erro de renderização:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-red-200 text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Algo deu errado nesta tela
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Ocorreu um erro inesperado ao exibir a página. Tente recarregar — seus dados estão
              salvos.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar tela
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
