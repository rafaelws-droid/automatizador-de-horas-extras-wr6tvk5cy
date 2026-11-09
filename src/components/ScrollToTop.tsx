import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Ao navegar entre telas pelo menu, leva o usuário de volta ao topo da página.
 * Sem isso, trocar de tela com a página rolada dava a impressão de que
 * "nada atualizou", porque o conteúdo novo aparecia fora da área visível.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default ScrollToTop
