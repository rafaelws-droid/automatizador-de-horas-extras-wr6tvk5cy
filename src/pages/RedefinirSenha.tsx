import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
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
import { confirmarRedefinicaoSenha } from '@/services/auth'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Link inválido ou incompleto. Solicite um novo link de recuperação.')
      return
    }
    if (senha.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setError('As senhas não coincidem. Verifique e tente novamente.')
      return
    }

    try {
      setIsLoading(true)
      await confirmarRedefinicaoSenha(token, senha, confirmacao)
      navigate('/login', {
        replace: true,
        state: { mensagem: 'Senha redefinida com sucesso. Entre com sua nova senha.' },
      })
    } catch (err: unknown) {
      console.error('Erro ao redefinir senha:', err)
      setError(
        'Não foi possível redefinir a senha. O link pode estar expirado ou já ter sido usado. Solicite um novo link de recuperação.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img
            src={logoSilveira}
            alt="Logo Silveira"
            className="mx-auto mb-3 h-24 w-24 rounded-2xl bg-white object-contain p-1 shadow-xl shadow-blue-500/25"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Automatizador de Horas Extras
          </h1>
        </div>

        <Card className="border-slate-800 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Definir nova senha
            </CardTitle>
            <CardDescription className="text-slate-600">
              Digite a nova senha e confirme. Ela deve ter no mínimo 8 caracteres.
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

              {!token && !error && (
                <Alert className="py-2.5 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800">
                    Este endereço não contém o link de redefinição. Abra o link enviado por e-mail.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-xs font-semibold text-slate-700">
                  Nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-9"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmacao" className="text-xs font-semibold text-slate-700">
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmacao"
                    type="password"
                    placeholder="••••••••"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    className="pl-9"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                type="submit"
                disabled={isLoading || !token}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Salvar nova senha
                  </>
                )}
              </Button>

              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
