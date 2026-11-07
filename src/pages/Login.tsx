import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import logoSilveira from '@/assets/logo-silveira-sem-fundo-azul-1-1abbf.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('rafaelws@silveiratransportes.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Por favor, informe seu e-mail e sua senha.')
      return
    }

    try {
      setIsLoading(true)
      await login(email, password)
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error('Erro de login:', err)
      setError('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillQuickCredentials = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('Skip@Pass')
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4">
      <div className="w-full max-w-md">
        {/* App Logo & Header */}
        <div className="mb-6 text-center">
          <img
            src={logoSilveira}
            alt="Logo Silveira"
            className="mx-auto mb-3 h-24 w-24 rounded-2xl bg-white object-contain p-1 shadow-xl shadow-blue-500/25"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Automatizador de Horas Extras
          </h1>
          <p className="mt-1 text-sm text-slate-400">Acesso restrito para Gestores de RH</p>
        </div>

        <Card className="border-slate-800 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Entrar no sistema
            </CardTitle>
            <CardDescription className="text-slate-600">
              Digite seu e-mail e senha cadastrados para acessar o painel
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  E-mail do Gestor
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="gestor@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50/80 p-3 border border-blue-100 text-xs text-blue-900">
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Acesso de Demonstração</span>
                </div>
                <p className="text-blue-700 mb-2">
                  Você pode usar a conta principal ou a conta demo para testar:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                    onClick={() => fillQuickCredentials('rafaelws@silveiratransportes.com')}
                  >
                    Usar conta principal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                    onClick={() => fillQuickCredentials('admin@empresa.com')}
                  >
                    Usar conta demo
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Acessar Painel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
