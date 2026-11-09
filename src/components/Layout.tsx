/* Layout Component - A component that wraps the main content of the app
   - Use this file to add a header, footer, or other elements that should be present on every page
   - This component is used in the App.tsx file to wrap the main content of the app */

import { Outlet, useLocation } from 'react-router-dom'

import { Navbar } from './Navbar'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      {/* key por rota: força o remonte da tela a cada navegação, para que
          clicar no menu SEMPRE recarregue os dados — inclusive ao clicar no
          item em que o usuário já está (antes, nada acontecia). */}
      <main
        key={location.pathname}
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Automatizador de Horas Extras — Gestão de RH • Dados sincronizados e prontos para exportação
        Google Sheets
      </footer>
    </div>
  )
}
