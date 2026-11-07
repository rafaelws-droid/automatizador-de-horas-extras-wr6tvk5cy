import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users,
  PlusCircle,
  History,
  LayoutDashboard,
  LogOut,
  FileBarChart,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import logoSilveira from '@/assets/logo-silveira-sem-fundo-azul-1-1abbf.png'

export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { label: 'Início', path: '/', icon: LayoutDashboard },
    { label: 'Colaboradores', path: '/colaboradores', icon: Users },
    { label: 'Equipamentos', path: '/equipamentos', icon: Wrench },
    { label: 'Novo Registro', path: '/novo-registro', icon: PlusCircle },
    { label: 'Registros', path: '/registros', icon: History },
    { label: 'Relatório', path: '/relatorio', icon: FileBarChart },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <img
            src={logoSilveira}
            alt="Logo Silveira"
            className="h-10 w-10 rounded-lg bg-white object-contain"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              Silveira · Horas Extras
            </span>
            <span className="text-xs text-slate-500 font-medium">Controle & Automação</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden lg:flex flex-col items-end text-xs">
              <span className="font-semibold text-slate-800">{user.name || 'Gestor de RH'}</span>
              <span className="text-slate-500 truncate max-w-[180px]">{user.email}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 hover:border-red-200"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="md:hidden border-t border-slate-100 bg-slate-50/80 px-2 py-1.5">
        <div className="grid grid-cols-3 gap-1 text-center">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-100/70 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <Icon
                  className={`h-4 w-4 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
                />
                <span className="truncate w-full text-[11px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
