import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { setupAuthErrorHandling } from '@/lib/pocketbase/authGuard'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  signup: (name: string, email: string, pass: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Valida a sessão no servidor com teto de tempo — nunca trava o carregamento. */
async function authRefreshComTimeout(): Promise<void> {
  if (!pb.authStore.isValid) return
  await Promise.race([
    pb.collection('users').authRefresh(),
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error('timeout_validacao_sessao')), 8000),
    ),
  ]).catch((err) => {
    // Sessão inválida/expirada (401) ou rede fora: limpa o token local.
    // No caso de rede fora, o authStore ficaria com token "válida" mas rejeitado
    // pelo servidor — melhor deixar a tela de login cuidar do re-login.
    console.warn('Validação de sessão falhou:', err)
    pb.authStore.clear()
  })
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(true)
  const inicializado = useRef(false)

  useEffect(() => {
    // Guarda global de 401: sessão expirada em QUALQUER requisição limpa o authStore,
    // o que dispara o onChange abaixo e leva o usuário ao login.
    setupAuthErrorHandling()

    const validarSessao = async () => {
      try {
        await authRefreshComTimeout()
      } finally {
        setIsLoading(false)
      }
    }
    void validarSessao()

    const unsubscribe = pb.authStore.onChange((newToken, model) => {
      setToken(newToken)
      if (model) {
        setUser({
          id: model.id,
          email: model.email,
          name: model.name || model.email,
          avatar: model.avatar,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Fallback de segurança: se por qualquer motivo a validação não terminar
  // (ex.: promise perdida), destrava o loading após 10s para nunca travar a tela.
  useEffect(() => {
    if (inicializado.current) return
    inicializado.current = true
    const t = setTimeout(() => setIsLoading(false), 10000)
    return () => clearTimeout(t)
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email.trim(), pass)
  }

  const signup = async (name: string, email: string, pass: string) => {
    await pb.collection('users').create({
      name: name.trim(),
      email: email.trim(),
      password: pass,
      passwordConfirm: pass,
    })
    await pb.collection('users').authWithPassword(email.trim(), pass)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
