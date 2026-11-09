import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  LogIn,
  UserPlus,
  CheckCircle2,
} from 'lucide-react'
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
import { getErrorMessage } from '@/lib/pocketbase/errors'

type Modo = 'login' | 'signup'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup, isAuthenticated } = useAuth()

  const [modo, setModo] = useState<Modo>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(
    (location.state as { mensagem?: string } | null)?.mensagem ??
      ((location.state as { sessaoExpirada?: boolean } | null)?.sessaoExpirada
        ? 'Sua sessão expirou por segurança. Faça login novamente para continuar.'
        : null),
  )

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  const destinoAposLogin = () => {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSucesso(null)

    if (!email.trim() || !password) {
      setError('Por favor, informe seu e-mail e sua senha.')
      return
    }

    if (modo === 'signup') {
      if (!name.trim()) {
        setError('Por favor, informe o seu nome.')
        return
      }
      if (password.length < 8) {
        setError('A senha deve ter no mínimo 8 caracteres.')
        return
      }
      if (password !== passwordConfirm) {
        setError('As senhas não coincidem. Verifique e tente novamente.')
        return
      }
    }

    try {
      setIsLoading(true)
      if (modo === 'signup') {
        await signup(name, email, password)
        setSucesso('Conta criada com sucesso! Bem-vindo ao sistema.')
        destinoAposLogin()
      } else {
        await login(email, password)
        destinoAposLogin()
      }
    } catch (err: unknown) {
      console.error('Erro de autenticação:', err)
      const msg = getErrorMessage(err)
      setError(
        msg && msg !== 'An unexpected error occurred.'
          ? msg
          : modo === 'signup'
            ? 'Não foi possível criar a conta. Verifique os dados e tente novamente.'
            : 'Credenciais inválidas. Verifique seu e-mail e senha.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const alternarModo = () => {
    setModo(modo === 'login' ? 'signup' : 'login')
    setError(null)
    setSucesso(null)
    setPasswordConfirm('')
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
              {modo === 'login' ? 'Entrar no sistema' : 'Criar nova conta'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {modo === 'login'
                ? 'Digite seu e-mail e senha cadastrados para acessar o painel'
                : 'Cadastre-se com e-mail e senha para começar a usar o sistema'}
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

              {sucesso && (
                <Alert className="py-2.5 border-emerald-200 bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-xs text-emerald-800">
                    {sucesso}
                  </AlertDescription>
                </Alert>
              )}

              {modo === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                    Seu nome
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ex.: Rafael Silveira"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  E-mail {modo === 'login' ? 'do Gestor' : ''}
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
                    minLength={modo === 'signup' ? 8 : undefined}
                    autoComplete={modo === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>

              {modo === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-slate-700">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="pl-9"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A senha deve ter no mínimo 8 caracteres.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {modo === 'login' ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  <>
                    {modo === 'login' ? (
                      <>
                        Acessar Painel
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Criar conta e entrar
                        <UserPlus className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </>
                )}
              </Button>

              {modo === 'login' && (
                <Link
                  to="/esqueci-senha"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              )}

              <button
                type="button"
                onClick={alternarModo}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span className="flex items-center gap-1.5">
                  {modo === 'login' ? (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Não tem conta? Criar cadastro
                    </>
                  ) : (
                    <>
                      <LogIn className="h-3.5 w-3.5" />
                      Já tenho conta — voltar ao login
                    </>
                  )}
                </span>
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
