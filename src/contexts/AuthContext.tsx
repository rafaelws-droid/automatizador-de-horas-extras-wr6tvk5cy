import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      setUser({
        id: pb.authStore.record.id,
        email: pb.authStore.record.email,
        name: pb.authStore.record.name || pb.authStore.record.email,
        avatar: pb.authStore.record.avatar,
      })
      setToken(pb.authStore.token)
    } else {
      setUser(null)
      setToken(null)
    }
    setIsLoading(false)

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
